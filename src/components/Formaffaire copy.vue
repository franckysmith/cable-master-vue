<template>
  <div>
    <p>bonjour</p>
    <div v-for="affaire in affaires" :key="affaire.affairid">
      <p>{{ affaire.name }}</p>
    </div>
    <!-- <div class="search">
      <ul>
        <li style="display flex,padding:10px">
          <button @click="techSelected(135)">John</button>
          <button @click="techSelected(3)">Edward</button>
          <button @click="techSelected(32)">francky</button>
          <button @click="allTechSelected()">All</button>
        </li>
        <li>
          <button @click="searchInput('affaire')">Choisir l'affaire</button>
          <select v-model="affaireSelected">
            <option
              v-for="affaire in inputType"
              :key="affaire.affairid"
              :value="affaire"
              >{{ affaire.name }}
            </option>
          </select>
        </li>
      </ul>
    </div> -->

    <form @submit.prevent="addAffaire">
      <div v-for="affaire in search" :key="affaire.affairid">
        <div class="entete">
          <input
            v-model="affaire.name"
            class="titre_affaire"
            type="text"
            placeholder="Nom de l'affaire"
          />

          <input class="button" type="submit" value="Ma liste" />
          <input class="button" type="submit" value="New" />
        </div>
        <div class="dates">
          <label for="prepa">Prépa</label>
          <input
            v-model="affaire.prep_date"
            style="width:140px"
            type="date"
            name="retour"
          />
          <label for="r_am">matin</label>
          <input v-model="affaire.prep_time" type="checkbox" name="r_am" />
          <label for="r_pm">aprèsMidi</label>
          <input type="checkbox" name="r_pm" />
        </div>
        <div>
          <div class="dates">
            <label for="sortie">Sortie</label>
            <input
              v-model="affaire.receipt_date"
              style="width:140px"
              type="date"
              name="sortie"
            />
            <label for="s_matin">matin</label>
            <input
              v-model="affaire.receipt_time"
              :true-value="1"
              :false-value="0"
              type="checkbox"
              name="s_matin"
            />
            <label for="s_apm">aprèsMidi</label>
            <input
              v-model="affaire.receipt_time"
              :true-value="0"
              :false-value="1"
              type="checkbox"
              name="s_apm"
            />
          </div>
          <div class="dates">
            <label for="retour">Retour</label>
            <input
              v-model="affaire.return_date"
              style="width:140px"
              type="date"
              name="retour"
            />
            <label for="r_am">matin</label>
            <input v-model="affaire.return_time" type="checkbox" name="r_am" />
            <label for="r_pm">aprèsMidi</label>
            <input type="checkbox" name="r_pm" />
          </div>

          <div class="cont_2">
            <div class="tech">
              <input
                v-model="affaire.tech_name"
                type="text"
                placeholder="Nom du technicien"
              />

              <label for="face">face</label>
              <input
                v-model="affaire.front"
                :true-value="1"
                :false-value="0"
                type="checkbox"
                name="face"
              />
              <label for="mon"> mon</label>
              <input
                v-model="affaire.monitor"
                :true-value="1"
                :false-value="0"
                type="checkbox"
                name="mon"
              />
              <label for="scene"> scène</label>
              <input
                v-model="affaire.stage"
                :true-value="1"
                :false-value="0"
                type="checkbox"
                name="scene"
              />
              <input class="button" type="submit" value="Résumé" />
              <input class="button" type="submit" value="note" />
            </div>
            <div style="display:flex">
              <div>
                <input @click="submit" class="button" type="submit" />

                <label for="end">Terminé </label>
                <input type="checkbox" name="end" id="end" />
              </div>

              <div>
                <label for="update">Update </label>
                <input
                  v-model="affaire.timestamp"
                  style="width:150px"
                  type="timestamp"
                  name="update"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
import { ref } from "vue";
import { Api } from "../js/api.js";
const url = "https://cinod.fr/cables/api.php";
const api = new Api(url);

export default {
  name: "Formaffaire",

  setup(props, context) {
    context.emit("lessonaffaire", affaire);
    let affaire = ref([]);
    let affaires = ref([]);

    api
      .call("affair_get")
      .then(response => {
        affaires.value = response;
        console.log("affair_get:", response);
      })
      .catch(response => {
        console.log("affair_get:", response);
      });

    const inputType = ref([affaire.value]);
    const affaireSelected = ref("");
    console.log("affaire.value", affaire.value);

    function searchInput(arg) {
      inputType.value = arg;
    }
    return {
      searchInput,
      affaireSelected,
      inputType
    };
  }
};
</script>

<style>
input {
  padding: 5px;
}
.entete {
  display: flex;
  justify-content: space-around;
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
.button {
  margin: 10px;
  padding: 5px;
  min-width: 50px;
  background: #4dcc59;
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}
.dates {
  margin: 10px;
  display: flex;
  justify-content: space-around;
}
.cont_2 {
  display: flex;
}
.cont_2 input {
  margin: 5px;
}
.tech {
  width: 200px;
}
</style>
