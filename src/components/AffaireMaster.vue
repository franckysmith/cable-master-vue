<template>
  <div class="main" v-for="affaire in affaires" :key="affaire.affairid">
    <div class="content">
      <input type="checkbox" />
      <h4>{{ affaire.name }}</h4>
      <!-- <span @click="setColorIndicator(size)" class="taille">
        {{ size }}
      </span> -->
      <h5>{{ affaire.tech_name }}</h5>
    </div>

    <div class="content2">
      <div class="date-master">
        <div
          :class="affaire.prep_time == 'morning' ? 'gradientp' : 'gradientm'"
        >
          {{
            format(new Date(affaire.prep_date), "EEEE  dd ", {
              locale: fr
            })
          }}
        </div>

        <div
          :class="affaire.prep_time == 'morning' ? 'gradientp' : 'gradientm'"
        >
          {{ affaire.prep_time == "morning" ? "ap-midi" : "matin" }}
        </div>
      </div>
      <div class="technote">
        {{ affaire.tech_note }}
      </div>
      <div class="content-button">
        <button
          type="button"
          @click="modalOpen(affaire.description)"
          :class="affaire.description ? 'buttonv' : 'button'"
        >
          D
        </button>

        <button
          type="button"
          @click="modalOpen(affaire.master_note)"
          :class="affaire.master_note ? 'buttonv' : 'button'"
        >
          A
        </button>

        <button
          type="button"
          @click="modalOpen(affaire.tech_note)"
          :class="affaire.tech_note ? 'buttonv' : 'button'"
        >
          T
        </button>
      </div>
    </div>
  </div>
</template>

<script>
// import { ref } from "vue";
import {
  format,
  subDays,
  formatRelative,
  startOfTomorrow,
  isTomorrow,
  addDays,
  isAfter,
  isToday,
  isYesterday,
  add
} from "date-fns";
import { fr } from "date-fns/locale";

export default {
  name: "AfffaireMaster",
  props: {
    affaires: { type: Array },
    dateP: { type: String }
  },

  setup() {
    // let affaires = ref([]);
    function today() {
      return format(new Date(), "eeee dd MMMM yyyy", { locale: fr });
    }
    return {
      format,
      subDays,
      formatRelative,
      startOfTomorrow,
      isTomorrow,
      addDays,
      isAfter,
      isToday,
      isYesterday,
      add,
      fr,
      today
    };
  }
};
</script>

<style scoped>
.button-select {
  display: flex;
  width: 350px;
}
.button {
  margin: 10px;
  padding: 5px;
  width: 20px;
  background: #dce0dd;
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}
.buttonv {
  margin: 10px;
  padding: 5px;
  width: 20px;
  background: #4dcc59;

  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}
.checkbox {
  border: 1px solid black;
  padding: 2px;
}
.clickable {
  cursor: pointer;
}
.content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* width: 365px; */
  height: 35px;
  background: rgb(235, 233, 233);
  padding: 5px;
  /* margin: 0px 5px; */
}
.content2 {
  display: flex;
  justify-content: space-between;
  width: 365px;
  align-items: center;
  margin: 0px 5px;
  border-bottom: 1px solid black;
}
.content-button {
  display: flex;
  justify-content: space-between;
}
.date-master {
}
h4 {
  width: 220px;
  height: 15px;
  text-align: left;

  /* padding-bottom: 10px; */
}
.date-master {
  /* width: 10px; */
  /* margin: 0px 5px; */
}
.event-type {
  display: flex;
  margin: 0px 5px;
}
.event-type h3 {
  color: red;
  height: 10px;
}
.head-today {
  padding-left: 170px;
  display: flex;
}
.head-label {
  padding-left: 50px;
}

h5 {
  width: 60px;
  text-align: center;
  overflow: hidden;
}

li {
  list-style: none;
  height: 20px;
  padding: 0px;
}

.main {
  border: 1px black solid;
}

.taille {
  padding: 5px;
  font-size: 10px;
}
.technote {
  font-size: 10px;
  text-align: left;
  margin: 3px 5px;
}
.titre-day {
  display: flex;
  margin: 10px;
  padding: 5px;
  background: #4dcc59;
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}

ul.contentt {
  height: 25px;
}
.red {
  background-color: red;
}
.orange {
  background-color: orange;
}
.grey {
  background-color: rgb(255, 251, 251);
}
.gradientp {
  white-space: wrap;
  width: 70px;
  background: rgb(241, 241, 249);
  background: linear-gradient(
    90deg,
    rgba(241, 241, 249, 1) 41%,
    rgba(77, 204, 89, 1) 100%
  );
}
.gradientm {
  white-space: wrap;
  width: 70px;
  background: rgb(74, 74, 143);
  background: linear-gradient(
    270deg,
    rgba(241, 241, 249, 1) 41%,
    rgba(77, 204, 89, 1) 100%
  );
}
</style>
