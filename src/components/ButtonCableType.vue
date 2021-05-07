<template>
  <div class="post">
    <button
      @click="selectype('speaker')"
      :class="typechoose === 'speaker' ? 'selectedtype' : ''"
    >
      HP
    </button>
    <button
      @click="selectype('electrical')"
      :class="typechoose === 'electrical' ? 'selectedtype' : ''"
    >
      Elec
    </button>
    <button
      @click="selectype('module')"
      :class="typechoose === 'module' ? 'selectedtype' : ''"
    >
      Modules
    </button>
    <button
      @click="selectype('special')"
      :class="typechoose === 'special' ? 'selectedtype' : ''"
    >
      Spéciaux
    </button>
    <button
      @click="selectype('other')"
      :class="typechoose === 'other' ? 'selectedtype' : ''"
    >
      autres
    </button>
    <button
      @click="selectype('microphone')"
      :class="typechoose === 'microphone' ? 'selectedtype' : ''"
    >
      Micros
    </button>
    <button
      @click="selectype('c_type')"
      :class="typechoose === 'c_type' ? 'selectedtype' : ''"
    >
      caisses-type
    </button>
    <button
      @click="selectype('accessory')"
      :class="typechoose === 'accessory' ? 'selectedtype' : ''"
    >
      accessoires
    </button>
    <button
      @click="selectype('digital')"
      :class="typechoose === 'digital' ? 'selectedtype' : ''"
    >
      numériques
    </button>
  </div>

  <div>
    <div>
      <!-- celectype('microphone'+'digital'+'other' ..... ) -->
      <button class="button3" @click="filtreMaliste">ma liste</button>
      <!-- <button
            @click="filtreMaliste"
            :class="activ == thrue ? 'selectedtype' : ''"
          > -->
      <button
        @click="selectype('')"
        :class="typechoose === 'button3' ? 'selectedtype' : ''"
      >
        All
      </button>
      <input
        type="text"
        v-model="searchKey"
        placeholder="Rechercher un élément"
      />
    </div>
  </div>

  <div>
    <button
      class="button3"
      @click="filtreMaliste"
      type="button"
      v-if="malist == 1"
    >
      ma liste
    </button>
    <button
      class="button3"
      @click="filtreMaliste"
      type="button"
      v-if="malist == -1"
    >
      voir ma liste
    </button>
    <button @click="selectype('electrical')">All</button>
    <input
      type="text"
      v-model="searchKey"
      placeholder="Rechercher un élément"
    />
  </div>
</template>

<script>
// import { ref } from "vue";
export default {
  name: "ButtonCableType",
  props: {
    selectype: {
      type: String
    }
  }

  // setup(props) {
  //   let typechoose = ref("speaker");
  // }
};
</script>

<style scoped>
button {
  margin: 3px;
  cursor: pointer;
}
button.link {
  margin: 0px 0px 3px 0px;
}
.button {
  margin: 10px;
  padding: 5px;
  min-width: 50px;
  background: #ebe7df;
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}
.button1 {
  margin: 10px;
  padding: 5px;
  min-width: 50px;
  background: #ddcf10;
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}
.button2 {
  margin: 10px;
  padding: 5px;
  min-width: 50px;
  background: #eb910a;
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}

.content-liste {
  margin: auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.content-resume {
  display: flex;
  text-align: left;
  width: 400px;
  justify-content: space-between;
}

.content-number {
  width: 400px;
  height: 45px;
  /* display: flex; */
  /* flex-wrap: wrap; */
  /* margin: auto; */
}
.cont_2 {
  display: flex;
}
.cont_2 input {
  margin: 5px;
}
.dates {
  margin: 10px;
  display: flex;
  justify-content: space-around;
}
.entete {
  display: flex;
  justify-content: space-around;
}
.head {
  display: flex;
  /* margin: auto; */
  width: 400px;
  height: 20px;
  text-align: left;
  padding-left: 135px;
}
.head input {
  width: 30px;
  border: 1px rgb(211, 210, 210);
  font-size: 10px;
  font-weight: 400;
}
.head p {
  line-height: 1px;
  font-size: 12px;
}

input {
  padding: 5px;
}
.info-content {
  height: 14px;
  margin: 0px 0px 10px 0px;
  line-height: 0;
}
.info {
  font-size: 12px;
  width: 360px;
  height: 20px;
  display: flex;
  justify-content: space-between;
  text-align: left;
  /* padding: 0px; */
  margin: 0px 0px 5px 30px;
  font-style: italic;
  border-bottom: 1px solid;
}

.link {
  height: 18px;
  background: transparent;
  border: 1px solid grey;
  color: grey;
  /* line-height: 10; */
}
.link2 {
  height: 25px;
  background: transparent;
  border: 1px solid grey;
  color: grey;
}
.list {
  margin: 5px 25px;
  display: flex;
  text-align: left;
}

.list input {
  margin: 0px 10px;
  width: 30px;
}
.list_name {
  width: 220px;
}
.list_container {
  width: 400px;
}
.name {
  height: 10px;
  width: 100px;
}
.name h4 {
  margin: 10px 0px;
  font-weight: 500;
  text-align: left;
  width: 110px;
  padding: 1px 1px 1px 3px;
  /* margin-left: 5px; */
  background-color: #c1c7c33a;
  border-left: 5px solid #4dcc59;
}
.number {
  display: flex;
  border-width: 0px 0px 1px 0px;
  align-content: flex-start;
}

.number input {
  width: 18px;
  margin: 6px;
}
.number button {
  line-height: 10px;
  padding: 4px;
  margin-top: 10px;
  margin-right: 4px;
}
.number2 {
  display: flex;
  /* flex: auto 2; */
  margin: 0px 15px 20px;
}
.post {
  margin: 10px 0px 20px 0px;
  width: 400px;
}

.post button {
  margin: 10px;
  padding: 5px;
  min-width: 50px;
  background: #4dcc59;
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}
#save-liste {
  background-color: rgb(240, 216, 2);
  color: #0c0b0b;
  font-weight: 00;
  box-shadow: 5px 7px 5px 0px rgba(143, 141, 141, 0.75);
  -webkit-box-shadow: 5px 7px 5px 0px rgba(143, 141, 141, 0.75);
  -moz-box-shadow: 5px 7px 5px 0px rgba(143, 141, 141, 0.75);
}

.tech {
  width: 200px;
}
table {
  margin: 10px 0px 10px 0px;
  border: solid 1px;
  border-collapse: separate;
  border-spacing: 0px;
  text-align: left;
  -webkit-box-shadow: 0px 0px 30px -2px rgba(0, 0, 0, 0.75);
  -moz-box-shadow: 0px 0px 30px -2px rgba(0, 0, 0, 0.75);
  box-shadow: 0px 0px 30px -2px rgba(0, 0, 0, 0.75);
}
th {
  width: 250px;
  padding-left: 5px;
}
.titre_affaire {
  width: 200px;
  height: 32px;
  left: 34px;
  top: 63px;

  background: linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0) 100%);
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
}
</style>
