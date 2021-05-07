import { createStore } from "vuex";

import cablemaster from "./modules/cablemaster";
import cabletech from "./modules/cabletech";

const store = createStore({
  modules: {
    cablemaster,
    cabletech
  }
});

export default store;
