<template>
<!--    <span> Output:</span>-->
  <div>
    <textarea rows="3" class="history" v-model="history" disabled="disabled"/><br>
    <input v-model="output" disabled="disabled"><br>
<!--    <span> Input: </span>-->
      <input ref="input" v-model="input"><br>
    <div>
      <button class="calc-button" @click="setOperator('+')">+</button>
      <button class="calc-button" @click="setOperator('-')">-</button>
      <button class="calc-button" @click="clearAll">CLR</button>
    </div>
    <div>
      <button class="calc-button" @click="setOperator('*')">*</button>
      <button class="calc-button" @click="setOperator('/')">/</button>
      <button class="calc-button" @click="setOperator('Err')">Err</button>
    </div>
    <div>
      <button class="calc-button" @click="invertInput">±</button>
      <button class="calc-button" disabled="disabled">Exp</button>
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
      firstOperand: 0,
      secondOperand: 0,
      operator: "",
      result: 0,
      resultCalculated: false
    }
  },
  methods: {
    invertInput() { // TODO: calculate on backend
      const inputValue = parseInt(this.input);
      this.input = - inputValue;
    },
    setInputFocus() {
      this.$refs.input.focus();
    },
    setOperator(op) {
      this.operator = op;
      this.firstOperand = parseInt(this.input);
      this.output = `${this.firstOperand} ${this.operator}`;
      this.input = "";
      this.setInputFocus();
      this.resultCalculated = false;
    },
    clearAll() {
      this.firstOperand = 0;
      this.secondOperand = 0;
      this.input = "";
      this.output = "";
      this.result = 0;
      this.setInputFocus();
      this.resultCalculated = false;
    },
    async calculate() {
      if (!this.resultCalculated) {
        this.secondOperand = parseInt(this.input);
      } else {
        this.firstOperand = parseInt(this.input);
      }

      this.result = await this.requestCalculation(this.firstOperand, this.secondOperand, this.operator);

      this.output = `${this.firstOperand} ${this.operator} ${this.secondOperand} =`;

      const historyItem = [this.output, this.result].join(" ");
      this.historyList.push(historyItem);
      if (this.historyList.length > config.MAX_HISTORY_LENGTH) {
        this.historyList = this.historyList.slice(-config.MAX_HISTORY_LENGTH);
      }

      this.input = this.result;
      this.resultCalculated = true;

      this.setInputFocus();

      return;
    },
    async requestCalculation(firstOperand, secondOperand, operator) {
      const ops = {
        firstOperand,
        secondOperand,
        operator: config.BINARY_OPERATORS[operator]
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

      let result = await res.json();

      return result;
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
.history {
  resize: none;
}
.calc-button {
  width: 50px;
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
