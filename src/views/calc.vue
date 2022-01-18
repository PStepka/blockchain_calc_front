<template>
  <div class="wrapper">
    <textarea rows="3" class="history display" v-model="history" disabled="disabled"/><br>
    <input class="display" v-model="output" disabled="disabled"><br>
      <input ref="input" class="display" v-model="input"><br>
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
import {Biconomy} from "@biconomy/mexa"
const contract = require('./contract.json');

const domainType = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" },
];

const metaTransactionType = [
  { name: "nonce", type: "uint256" },
  { name: "from", type: "address" },
  { name: "functionSignature", type: "bytes" }
];

let domainData = {
  name: "mycalc",
  version: "1",
  chainId: 80001,
  verifyingContract: config.contractAddress,
};

let biconomy = undefined;

export default {
  name: 'Calc',
  async mounted() {
    if (!window.ethereum) {
      console.log("No window.ethereum obj");
    }

    await window.ethereum.enable();

    biconomy = new Biconomy(window.ethereum, {walletProvider: window.ethereum, apiKey: 'lOwZJ8ivy.e0dca552-803f-4c01-9294-6ccdf981b9c0', strictMode: true});
    this.ethersProvider = new ethers.providers.Web3Provider(biconomy);
    this.walletProvider = new ethers.providers.Web3Provider(window.ethereum);
    const walletSigner = this.walletProvider.getSigner();

    if (!walletSigner) {
      console.log("No wallet signer");
    }

    this.selectedAddress = (await walletSigner.getAddress()).toLowerCase();
    console.log("SELECTED ADDRESS", this.selectedAddress);

    biconomy.onEvent(biconomy.READY, async() => {
      console.log("Biconomy is ready");

      const contractAddress = config.contractAddress;
      console.log(contractAddress);
      const contractAbi = contract.output.abi;

      this.contrWithSigner = new ethers.Contract(contractAddress,
          contractAbi, biconomy.getSignerByAddress(this.selectedAddress));

      console.log(this.contrWithSigner);
      this.contractInterface = new ethers.utils.Interface(contractAbi);
    })


  },
  data() {
    return {
      newQuote: undefined,
      transactionHash: undefined,
      metaTxEnabled: true,
      selectedAddress: undefined,
      walletProvider: undefined,
      ethersProvider: undefined,
      quote: undefined,
      owner: undefined,
      historyList: [],
      input: "",
      output: "",
      firstOperand: undefined,
      secondOperand: undefined,
      operator: undefined,
      result: 0,
      contrWithSigner: undefined,
      contractInterface: undefined,

    }
  },
  methods: {
    getSignatureParameters(signature) {
      if (!ethers.utils.isHexString(signature)) {
        throw new Error(
            'Given value "'.concat(signature, '" is not a valid hex string.')
        );
      }
      var r = signature.slice(0, 66);
      var s = "0x".concat(signature.slice(66, 130));
      var v = "0x".concat(signature.slice(130, 132));
      v = ethers.BigNumber.from(v).toNumber();
      if (![27, 28].includes(v)) v += 27;
      return {
        r: r,
        s: s,
        v: v
      };
    },
    async onSubmitWithEIP712Sign() {
      console.log("selectedAddress:", this.selectedAddress);
      if (this.contrWithSigner) {
        this.transactionHash = "";
        if (this.metaTxEnabled) {
          console.log(`Getting user signature`);
          const nonce = await this.walletProvider.getTransactionCount(this.selectedAddress);
          console.log("nonce 1 = ", nonce);
          const functionSignature = this.contractInterface.encodeFunctionData("store", [ parseInt(this.input)]);
          console.log("functionSignature", functionSignature);
          const message = {};
          message.nonce = parseInt(nonce).toString();
          message.from = this.selectedAddress;
          message.functionSignature = functionSignature;

          const dataToSign = JSON.stringify({
            types: {
              EIP712Domain: domainType,
              MetaTransaction: metaTransactionType
            },
            domain: domainData,
            primaryType: "MetaTransaction",
            message: message
          });

          // Its important to use eth_signTypedData_v3 and not v4 to get EIP712 signature because we have used salt in domain data
          // instead of chainId
          let signature = await this.walletProvider.send("eth_signTypedData_v4", [this.selectedAddress, dataToSign]);
          console.log("data signature:", signature);
          let { r, s, v } = this.getSignatureParameters(signature);
          console.log("r s v = ", r, s, v);
          await this.sendSignedTransaction(this.selectedAddress, functionSignature, r, s, v);
        } else {
          console.log("Sending normal transaction");
          let tx = await this.contrWithSigner.store(this.input);
          console.log("Transaction hash : ", tx.hash);
          console.log(`Transaction sent by relayer with hash ${tx.hash}`);
          let confirmation = await tx.wait();
          console.log(confirmation);
          this.transactionHash = tx.hash;

          console.log("Transaction confirmed on chain");
        }
      } else {
        console.log("Not initialized yet");
      }
    },
    async sendSignedTransaction(userAddress, functionData, r, s, v) {
      try {
        console.log(`Sending transaction via Biconomy`);
        let tx = await this.contrWithSigner.executeMetaTransaction(userAddress, functionData, r, s, v);
        console.log(`Transaction sent. Waiting for confirmation ..`)
        await tx.wait(1);
        console.log("Transaction hash : ", tx.hash);
        //let confirmation = await tx.wait();
        console.log(tx);
        this.transactionHash = tx.hash;

        console.log("Transaction confirmed on chain");
      } catch (error) {
        console.log(error);
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

      await this.onSubmitWithEIP712Sign();

      // const tx = this.contrWithSigner.store(input);
      // const old = this.input;
      // this.input = "Please wait...";
      //
      // await tx;
      //
      // this.input = old;


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
