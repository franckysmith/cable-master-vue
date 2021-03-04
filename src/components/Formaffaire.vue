<template>
  <div>
    <div class="search">
      <ul>
        <li style="display flex,padding:10px">
          <button @click="techSelected(135)">John</button>
          <button @click="techSelected(3)">Edward</button>
          <button @click="techSelected(32)">francky</button>
          <button @click="techSelected()">All</button>
        </li>
        <li>
          <!-- <label for="selectaff">Choisir une affaire: </label> -->
          <option value="" selected disabled>Sélectionner :</option>
          <select
            v-model="affaireSelectedId"
            @change="selectedaff(affaireSelectedId)"
            id="selectaff"
          >
            <option value="" disabled selected hidden>select food</option>
            <option
              v-for="affairere in affaireSelectedTech"
              :key="affairere.affairid"
              :value="affairere"
              placeholder="choisir"
              >{{ affairere.name }}
            </option>
          </select>
        </li>
      </ul>
    </div>

    <form @subbmit.prevent="saveAffaire">
      <div v-for="affaire in search" :key="affaire.affairid">
        <div class="entete">
          affairid:{{ affaire.affairid }}
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
                <button @click="submit" class="button" type="submit">
                  Enregistrer
                </button>

                <label for="end">Terminé </label>
                <input type="checkbox" name="end" />
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
import { ref, computed } from "vue";
import { Api } from "../js/api.js";
const url = "https://cinod.fr/cables/api.php";
const api = new Api(url);

export default {
  name: "Formaffaire",

  setup(props, context) {
    let affaire = ref([]);
    let affaires = ref([]);

    // function affair techSelected button to change technician => liste d'affaires

    let searchby = ref([]);
    let affaireSelect = ref([]);
    let affaireSelectedId = ref([]);
    let affaireSelectedTech = ref([]);
    let affaireSelected = ref([]);
    let selectAffaire = ref([]);

    // search = ref([]);

    // button technician id   => affaireSelectedTech

    function techSelected(param) {
      let searchby = { tech_id: param };

      api
        .call("affair_get", searchby)
        .then(response => {
          affaireSelectedTech.value = response;
        })
        .catch(response => {
          console.log("affair_get:", response);
        });
    }
    function selectedaff(data) {
      context.emit("lessonaffaire", data.affairid);
      // affairidToCablagetech = data.affairid;
      console.log("selectedaff", data.affairid);
    }

    let search = computed(() => {
      return affaireSelectedTech.value.filter(t => {
        return t.affairid.includes(affaireSelectedId.value.affairid);
      });
    });

    return {
      searchby,
      selectAffaire,
      techSelected,
      // toListeAffaire,
      affaireSelectedId,
      affaireSelected,
      affaireSelectedTech,
      affaires,
      affaire,
      search,
      affaireSelect,
      // affairtruc,
      selectedaff

      // affairidToCablagetech
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
li ul {
  list-style: none;
}
</style>
