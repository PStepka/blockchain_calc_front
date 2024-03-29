<template>
  <div class="wrapper">
    <textarea rows="3" class="history display" v-model="history" disabled="disabled"/><br>
    <input class="display" v-model="output" disabled="disabled"><br>
      <input ref="input" class="display" v-model="input" @keypress="onInput"><br>
    <div>
      <button class="calc-button" @click="setBinaryOperator('+')">+</button>
      <button class="calc-button" @click="setBinaryOperator('-')">-</button>
      <button class="calc-button" @click="clearAll">CLR</button>
    </div>
    <div>
      <button class="calc-button" @click="setBinaryOperator('*')">*</button>
      <button class="calc-button" @click="setBinaryOperator('/')">/</button>
      <button class="calc-button" @click="store">Set</button>
    </div>
    <div>
      <button class="calc-button" @click="get">mr</button>
      <button class="calc-button" @click="useUnaryOperator('sqrt')">√</button>
      <button class="calc-button" @click="calculate">=</button>
    </div>
  </div>
</template>

<script>
import { config } from '@/config';
import { ethers } from 'ethers';
const contract = require('./contract.json');

export default {
  name: 'Calc',
  async mounted() {
    // A Web3Provider wraps a standard Web3 provider, which is
    // what MetaMask injects as window.ethereum into each page
    await window.ethereum.enable();

    const provider = new ethers.providers.Web3Provider(window.ethereum);

    console.log(await provider.listAccounts());
    // The MetaMask plugin also allows signing transactions to
    // send ether and pay to change state within the blockchain.
    // For this, you need the account signer...
    const signer = provider.getSigner();
    const balance = await provider.getBalance("0x9F327c8554B5ADB5eD5d9051Ecd91CfC1eac409a");

    console.log(balance.toString());
    console.log(ethers.utils.formatEther(balance));

    const contractAddress = "0x908609443767cf83d2cA39c86A89F60a11EDC19E";
    const contractAbi = contract.output.abi;

    const contr = new ethers.Contract(contractAddress, contractAbi, provider);

    console.log((await contr.get()).toString());

    const contrWithSigner = contr.connect(signer);
    this.contrWithSigner = contrWithSigner;

  },
  data() {
    return {
      historyList: [],
      input: "",
      output: "",
      firstOperand: undefined,
      secondOperand: undefined,
      operator: undefined,
      result: 0,
      contrWithSigner: null
    }
  },
  methods: {
    async onInput ($event) {
      const key = $event.key;
      if (config.BINARY_OPERATORS[key] !== undefined) {
        $event.preventDefault();
        await this.setBinaryOperator(key);
        return;
      }

      if (key === "=") {
        $event.preventDefault();
        await this.calculate();
        return;
      }

      const keyCode = ($event.keyCode ? $event.keyCode : $event.which);
      if (keyCode < 48 || keyCode > 57) {
        $event.preventDefault();
      }
    },
    async useUnaryOperator(operator) {
      const inputValue = this.input? parseInt(this.input) : 0;
      if (isNaN(inputValue)) {
        this.output = "Error";
        return;
      }

      try {
        this.output = "Please wait..."
        const result = await this.requestCalculation(inputValue, undefined, config.UNARY_OPERATORS[operator]);
        this.input = result;
        this.output = `${operator}(${inputValue}) =`;
        this.addToHistory([this.output, result].join(" "));
      } catch (e) {
        console.log(e);
        this.output = "Error";
      }
    },
    setInputFocus() {
      this.$refs.input.focus();
    },
    async setBinaryOperator(op) {
      this.firstOperand = this.input? parseInt(this.input) : 0;
      if (isNaN(this.firstOperand)) {
        this.output = "Error";
        return;
      }

      this.operator = op;
      this.output = `${this.firstOperand} ${this.operator}`;
      this.input = "";
      this.setInputFocus();
    },
    clearOperation() {
      this.firstOperand = undefined;
      this.secondOperand = undefined;
      this.operator = undefined;
    },
    clearAll() {
      this.clearOperation();
      this.input = "";
      this.output = "";
      this.result = 0;
      this.setInputFocus();
    },
    async calculate() {
      if (!this.operator) {
        return;
      }

      const input = this.input? parseInt(this.input) : 0;
      if (isNaN(input)) {
        console.log("Wrong input: ", this.input);
        this.output = "Error";
      }

      this.secondOperand = input;

      try {
        this.output = "Please wait..."
        this.result = await this.requestCalculation(this.firstOperand, this.secondOperand,
            config.BINARY_OPERATORS[this.operator]);
        this.output = `${this.firstOperand} ${this.operator} ${this.secondOperand} =`;
        this.clearOperation();
        const historyItem = [this.output, this.result].join(" ");
        this.addToHistory(historyItem);

        this.input = this.result;
        this.setInputFocus();
      } catch (e) {
        console.log(e);
        this.output = "Error";
      }
    },
    addToHistory(item) {
      this.historyList.push(item);
      if (this.historyList.length > config.MAX_HISTORY_LENGTH) {
        this.historyList = this.historyList.slice(-config.MAX_HISTORY_LENGTH);
      }
    },
    async requestCalculation(firstOperand, secondOperand, operator) {
      const ops = {
        firstOperand,
        secondOperand,
        operator
      }

      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:  JSON.stringify(ops)
      };

      const res = await fetch(
          `${config.BACKEND_URL}calculate/`,
          requestOptions
      );

      if (res.ok) {
        let result = await res.json();
        return result;
      } else {
        console.log(res);
        throw res.statusText;
      }
    },
    async store() {
      const input = parseInt(this.input);

      const tx = this.contrWithSigner.store(input);

      await tx;
    },
    async get() {
      const requestOptions = {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      };

      const res = await fetch(
          `${config.BACKEND_URL}get/`,
          requestOptions
      );

      if (res.ok) {
        let result = await res.json();
        this.input = result;
        return result;
      } else {
        console.log(res);
        throw res.statusText;
      }
    },
  },
  computed: {
    history() {
      return this.historyList.join("\n");
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.wrapper {
  width: 200px;
  background-color: aliceblue;
  margin: auto;
}
.display {
  box-sizing: border-box;
  width: 100%;
}
.history {
  resize: none;
}
.calc-button {
  width: 50px;
  margin: 0.5rem;
}
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
