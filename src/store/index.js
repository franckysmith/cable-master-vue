import { createStore } from "vuex";

import cablemaster from "./modules/cablemaster";
import cabletech from "./modules/cabletech";
import affaire from "./modules/affaire";

const store = createStore({
  modules: {
    cablemaster,
    cabletech,
    affaire
  }
});

export default store;
