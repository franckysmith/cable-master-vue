<template>
  <div v-for="cable in allCables" :key="cable.cableid">
    <div>
      <div>
        <div class="number">
          <div>
            <input type="checkbox" :checked="cable.isChecked" />
          </div>
          <div class="name">
            <h4>{{ cable.name }}</h4>
          </div>

          <div>
            <input name="spare_count" v-model="cable.spare_count" />
          </div>

          <div>
            <input name="" v-model="cable.z1" />
          </div>
          <div>
            <input name="" v-model="cable.z2" />
          </div>
          <div>
            <input name="" v-model="cable.z3" />
          </div>
          <div>
            <input name="" v-model="cable.z4" />
          </div>
          <div>
            <input name="" v-model="cable.z5" />
          </div>
          <div>
            <input name="" v-model="cable.count" />
          </div>
          <div>
            {{ calculateTotal(cable) }}
          </div>
        </div>
        <div class="info-content">
          <div class="info">
            <p>{{ cable.info }}</p>
            <button type="button" class="link">
              <a href="cable.link" target="_blank">link</a>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref } from "vue";

export default {
  props: {
    cables: {
      type: Array
    },
    cableType: {
      type: String
    },
    showMyList: {
      type: Boolean
    }
  },

  setup(props) {
    let allCables = ref([]);

    function calculateTotal(cable) {
      return (
        parseInt(cable.spare_count) +
        parseInt(cable.z1 || 0) +
        parseInt(cable.z2 || 0) +
        parseInt(cable.z3 || 0) +
        parseInt(cable.z4 || 0) +
        parseInt(cable.z5 || 0)
      );
    }

    allCables = computed(() => {
      if (props.showMyList) {
        return props.cables.filter(c => calculateTotal(c) > 0);
      }
      return props.cables;
    });

    return {
      calculateTotal,
      allCables
    };
  }
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
.button2 {
  margin: 10px;
  padding: 5px;
  min-width: 50px;
  background: #ebe7df;
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}
.button2.active {
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

.selectedtype {
  color: #fff;
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
