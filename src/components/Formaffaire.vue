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
          <!-- <option selected disabled>Sélectionner :</option> -->
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

    <form v-for="affaire in search" :key="affaire.affairid">
      <div class="entete">
        <input
          class="entete-name-aff"
          v-model="affaire.name"
          placeholder="Nom de l'affaire"
        />
        <input
          v-model="affaire.ref"
          class="entete-ref_aff"
          placeholder="Référence"
        />

        <button class="button" @clic="add_affair" value="New" type="button">
          New
        </button>
      </div>
      <div class="label">
        <div>matin</div>
        <div style="margin-left:20px">ap-midi</div>
      </div>
      <div class="content-dates">
        <div class="dates">
          <h4>Prépa</h4>

          <input
            class="date-size"
            v-model="affaire.prep_date"
            type="date"
            name="retour"
          />

          <input
            v-model="affaire.prep_time"
            value="morning"
            type="checkbox"
            name="prep"
          />
          <input
            v-model="affaire.prep_time"
            value="afternoon"
            type="checkbox"
            name="prep"
          />
        </div>
        <div class="dates">
          <h4>Sortie</h4>

          <input
            class="date-size"
            v-model="affaire.receipt_date"
            type="date"
            name="sortie"
          />
          <input
            v-model="affaire.receipt_time"
            :value="morning"
            type="checkbox"
            name="s_am"
          />

          <input
            v-model="affaire.receipt_time"
            :value="afternoon"
            type="checkbox"
            name="s_pm"
          />
        </div>
        <div class="dates">
          <h4>Retour</h4>

          <input
            class="date-size"
            v-model="affaire.return_date"
            type="date"
            name="retour"
          />

          <input
            v-model="affaire.return_time"
            value="morning"
            type="checkbox"
            name="r-am"
          />
          <input
            v-model="affaire.return_time"
            value="afternoon"
            type="checkbox"
            name="r-pm"
          />
        </div>
      </div>

      <div class="cont_2">
        <div class="tech">
          <input
            class="tech-name"
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
        </div>

        <div class="contentUpdate">
          <div class="content-update1">
            <button
              @click="update_affair(affaire)"
              class="button"
              type="submit"
            >
              Enregistrer
            </button>

            <label for="end"
              >en ligne <input type="checkbox" name="end"
            /></label>
            <button @click="note = true" v-if="!note">note</button>
            <button @click="note = false" v-if="note">
              fermer note
            </button>
          </div>
          <div>
            <label for="update"
              >Update le:
              <input
                v-model="affaire.timestamp"
                style="width:150px"
                type="timestamp"
                name="update"
            /></label>
          </div>
        </div>
      </div>
      <textarea
        cols="50"
        rows="10"
        v-if="note"
        v-model.lazy="affaire.tech_note"
        placeholder="Laisser ici un message pour l'atelier piles etc ...."
      ></textarea>
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
  props: ["cables"],

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
      affaire.value = [""];
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

.cont_2 {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.cont_2 input {
  margin: 5px;
}
.content-update1 {
  display: flex;
  justify-content: space-around;
  align-items: baseline;
}
.content-dates {
  line-height: 0px;
}
.dates {
  padding: 0px;
  align-items: baseline;
  display: flex;
  justify-content: space-evenly;
  width: 400px;
}
.date-size {
  width: 120px;
}
.entete {
  display: flex;
  justify-content: space-around;
  width: 400px;
  margin: auto;
  align-items: baseline;
}

.entete-name-aff {
  width: 200px;
  height: 32px;
  /* left: 34px; */
  /* top: 63px; */

  background: linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0) 100%);
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
}
.entete-ref_aff {
  width: 60px;
  margin: 6px;

  background: linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0) 100%);
  border: 1px solid #000000;
  box-sizing: border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
}
form {
  width: 400px;
}

.tech-name {
  width: 120px;
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

.label {
  display: flex;
  margin-left: 260px;
  padding: 10px;
}
li {
  list-style: none;
}
ul {
  padding-inline-start: 0px;
}
#selectaff {
  width: 130px;
}
</style>
