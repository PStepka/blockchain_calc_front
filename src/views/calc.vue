<template>
<!--    <span> Output:</span>-->
  <div class="wrapper">
    <textarea rows="3" class="history display" v-model="history" disabled="disabled"/><br>
    <input class="display" v-model="output" disabled="disabled"><br>
<!--    <span> Input: </span>-->
      <input ref="input" class="display" v-model="input" @keypress="onInput"><br>
    <div>
      <button class="calc-button" @click="setBinaryOperator('+')">+</button>
      <button class="calc-button" @click="setBinaryOperator('-')">-</button>
      <button class="calc-button" @click="clearAll">CLR</button>
    </div>
    <div>
      <button class="calc-button" @click="setBinaryOperator('*')">*</button>
      <button class="calc-button" @click="setBinaryOperator('/')">/</button>
      <button class="calc-button" @click="setBinaryOperator('Err')">Err</button>
    </div>
    <div>
      <button class="calc-button" @click="useUnaryOperator('invert')">±</button>
      <button class="calc-button" @click="useUnaryOperator('sqrt')">√</button>
      <button class="calc-button" @click="calculate">=</button>
    </div>
  </div>
<!--    <button @click="getSum">Calculate</button>-->
</template>

<script>
import { config } from '../config';

export default {
  name: 'Calc',
  mounted() {

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
      resultCalculated: false
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
      const inputValue = parseInt(this.input);
      if (isNaN(inputValue)) {
        this.output = "Error";
        return;
      }

      this.operator = null;

      try {
        const result = await this.requestCalculation(inputValue, undefined, config.UNARY_OPERATORS[operator]);
        this.input = result;
        this.output = `${operator}(${inputValue}) =`;
        this.addToHistory([this.output, result].join(" "));
        this.resultCalculated = false;
      } catch (e) {
        this.output = "Error";// e.message;
      }
    },
    setInputFocus() {
      this.$refs.input.focus();
    },
    async setBinaryOperator(op) {
      if (this.operator && !this.resultCalculated) {
        await this.calculate();
      }

      this.firstOperand = parseInt(this.input);
      if (isNaN(this.firstOperand)) {
        this.output = "Error";
        return;
      }

      this.operator = op;
      this.output = `${this.firstOperand} ${this.operator}`;
      this.input = "";
      this.setInputFocus();
      this.resultCalculated = false;
    },
    clearAll() {
      this.firstOperand = undefined;
      this.secondOperand = undefined;
      this.operator = undefined;
      this.input = "";
      this.output = "";
      this.result = 0;
      this.setInputFocus();
      this.resultCalculated = false;
    },
    async calculate() {
      if (!this.operator) {
        return;
      }

      const input = parseInt(this.input);
      if (isNaN(input)) {
        console.log("Wrong input: ", this.input);
        this.output = "Error";
      }

      if (!this.resultCalculated) {
        this.secondOperand = input;
      } else {
        this.firstOperand = input;
      }

      try {
        this.result = await this.requestCalculation(this.firstOperand, this.secondOperand,
            config.BINARY_OPERATORS[this.operator]);
        this.output = `${this.firstOperand} ${this.operator} ${this.secondOperand} =`;

        const historyItem = [this.output, this.result].join(" ");
        this.addToHistory(historyItem);

        this.input = this.result;
        this.resultCalculated = true;

        this.setInputFocus();
      } catch (e) {
        console.log(e);
        this.output = "Error";
        return;
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
        //return res.statusText;
      }
    }
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
  width: -moz-available;
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
