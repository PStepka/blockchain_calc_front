<template>
<!--    <span> Output:</span>-->
  <div>
    <textarea rows="3" class="history" v-model="history" disabled="disabled"/><br>
    <input v-model="output" disabled="disabled"><br>
<!--    <span> Input: </span>-->
      <input ref="input" v-model="input"><br>
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
    async useUnaryOperator(operator) {
      const inputValue = parseInt(this.input);

      try {
        const result = await this.requestCalculation(inputValue, undefined, config.UNARY_OPERATORS[operator]);
        this.input = result;
        this.output = `${operator}(${inputValue}) =`;
        this.addToHistory([this.output, result].join(" "));
      } catch (e) {
        this.input = e.message;
      }
    },
    setInputFocus() {
      this.$refs.input.focus();
    },
    async setBinaryOperator(op) {
      if (this.operator) {
        await this.calculate();
      }

      this.operator = op;
      this.firstOperand = parseInt(this.input);
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
      if (!this.resultCalculated) {
        this.secondOperand = parseInt(this.input);
      } else {
        this.firstOperand = parseInt(this.input);
      }

      this.result = await this.requestCalculation(this.firstOperand, this.secondOperand,
        config.BINARY_OPERATORS[this.operator]);

      this.output = `${this.firstOperand} ${this.operator} ${this.secondOperand} =`;

      const historyItem = [this.output, this.result].join(" ");
      this.addToHistory(historyItem);

      this.input = this.result;
      this.resultCalculated = true;

      this.setInputFocus();

      return;
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

      if (res.status === 200) {
        let result = await res.json();
        return result;
      } else {
        console.log(res);
        return res.statusText;
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
