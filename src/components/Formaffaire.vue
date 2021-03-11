<template>
  <div>
    <div class="search-tech-aff">
      <ul>
        <li style="display flex,padding:10px">
          <button @click="techSelected(135)">John</button>
          <button @click="techSelected(3)">Edward</button>
          <button @click="techSelected(32)">francky</button>
          <button @click="techSelected()">All</button>
        </li>
        <li>
          <option value="" selected disabled>Sélectionner :</option>
          <select
            v-model="affaireSelectedId"
            @change="selectedaff(affaireSelectedId)"
            id="selectaff"
          >
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

    <form>
      <div v-for="affaire in search" :key="affaire.affairid">
        <div class="entete">
          <input
            v-model="affaire.name"
            class="titre_affaire"
            placeholder="Nom de l'affaire"
          />
          <input
            v-model="affaire.ref"
            class="ref_affaire"
            placeholder="Référence"
          />

          <button class="button" @clic.prevent="add_affair()" value="New">
            New
          </button>
        </div>
        <div class="dates">
          <label
            >Prépa
            <input
              v-model="affaire.prep_date"
              style="width:140px"
              type="date"
              name="retour"
          /></label>
          <label
            >précisez
            <select v-model="affaire.prep_time">
              <option value="morning">matin</option>
              <option value="afternoon">après-midi</option>
            </select>
          </label>
          <label
            >aprèsMidi <input type="checkbox" name="r_pm" value="afternoon"
          /></label>
        </div>
        <div>
          <div class="dates">
            <label for="sortie"
              >Sortie
              <input
                v-model="affaire.receipt_date"
                style="width:140px"
                type="date"
                name="sortie"
            /></label>
            <label for="s_matin"
              >matin
              <input
                v-model="affaire.receipt_time"
                :value="morning"
                type="checkbox"
                name="s_matin"
            /></label>
            <label for="s_apm"
              >aprèsMidi
              <input
                v-model="affaire.receipt_time"
                :true-value="0"
                :false-value="1"
                type="checkbox"
                name="s_apm"
            /></label>
          </div>
          <div class="dates">
            <label for="retour"
              >Retour
              <input
                v-model="affaire.return_date"
                style="width:140px"
                type="date"
                name="retour"
            /></label>
            <label for="r_am"
              >matin
              <input v-model="affaire.return_time" type="checkbox" name="r_am"
            /></label>
            <label for="r_pm"
              >aprèsMidi <input type="checkbox" name="r_pm"
            /></label>
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
              <button @click.prevent="note = true" v-if="!note">note</button>
              <button @click.prevent="note = false" v-if="note">
                fermer note
              </button>
              <textarea
                cols="50"
                rows="10"
                v-if="note"
                v-model="affaire.tech_note"
              ></textarea>
            </div>
            <div style="display:flex">
              <div>
                <button
                  @click.prevent="update_affair(affaire)"
                  class="button"
                  type="submit"
                >
                  Enregistrer
                </button>

                <label for="end">en ligne </label>
                <input type="checkbox" name="end" />
              </div>

              <div>
                <label for="update">Update le: </label>
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

import cablageServices from "@/services/cablage.js";

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
    let note = ref(false);
    let tech_id = ref("");
    let tech_name = ref("");
    let name = ref("");
    // let firstadd = ref("");

    // get affair by techid
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
    // emit vers views/Cabletech
    function selectedaff(data) {
      context.emit("lessonaffaire", data.affairid);
      console.log("selectedaff", data.affairid);
    }
    // update affair
    function update_affair(param) {
      console.log("formaffair | affairupdate", param);
      cablageServices.affaireupdate(param);
    }

    // add affair
    function add_affair() {
      let firstadd = {
        tech_id: tech_id.value,
        tech_name: tech_name.value,
        name: name.value
      };
      console.log("Formaffaire |add_affair", firstadd);
      cablageServices.affaireadd(firstadd);
    }

    // select affairid par technicien v-for in search
    let search = computed(() => {
      return affaireSelectedTech.value.filter(t => {
        return t.affairid.includes(affaireSelectedId.value.affairid);
      });
    });

    return {
      searchby,
      selectAffaire,
      techSelected,
      update_affair,
      add_affair,
      affaireSelectedId,
      affaireSelected,
      affaireSelectedTech,
      affaires,
      affaire,
      search,
      affaireSelect,
      selectedaff,

      note
    };
  }
};
</script>

<style>
.search-tech-aff li {
  margin-bottom: 15px;
}
.search-tech-aff select {
  margin-bottom: 15px;
}
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
.ref_affaire {
  width: 100px;
  height: 32px;
  left: 34px;
  top: 63px;
  box-sizing: border-box;
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
li {
  list-style: none;
}
</style>
