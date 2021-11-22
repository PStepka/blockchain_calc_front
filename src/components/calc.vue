<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
<!--    <span> Output:</span>-->
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
      <button class="calc-button" @click="setOperator('sqr')">sqrt</button>
    </div>
    <div>
      <button class="calc-button" @click="calculate">+/-</button>
      <button class="calc-button" @click="calculate">???</button>
      <button class="calc-button" @click="calculate">=</button>
    </div>
<!--    <button @click="getSum">Calculate</button>-->
  </div>
</template>

<script>
export default {
  name: 'Calc',
  props: {
    msg: String
  },
  data() {
    return {
      input: "",
      output: "",
      firstOperand: 0,
      secondOperand: 0,
      operator: "",
      result: 0
    }
  },
  methods: {
    setInputFocus() {
      this.$refs.input.focus();
    },
    setOperator(op) {
      this.operator = op;
      this.firstOperand = parseInt(this.input);
      this.output = `${this.firstOperand} ${this.operator}`;
      this.input = "";
      this.setInputFocus();
    },
    clearAll() {
      this.firstOperand = 0;
      this.secondOperand = 0;
      this.input = "";
      this.output = "";
      this.result = 0;
      this.setInputFocus();
    },
    async calculate() {
      this.secondOperand = parseInt(this.input);
      this.input = "";

      const ops = {
        firstOperand: this.firstOperand,
        secondOperand: this.secondOperand
      }

      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ops)
      };

      const res = await fetch(
          `http://localhost:3000/calculate/`,
          requestOptions
      );
    //  console.log(res);
      let quote = await res.json();

      this.result = quote;
      this.output = `${this.firstOperand} ${this.operator} ${this.secondOperand} =`;
      this.input = this.result;
//      this.operator = "";

      this.setInputFocus();

      return;
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
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
