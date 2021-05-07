export default {
  state: () => ({
    cables: [],
    ingeson: "franck"
  }),
  mutations: {
    SET_CABLES(state, payload) {
      state.cables = payload;
    }
  },
  actions: {
    setCables({ commit }, payload) {
      commit("SET_CABLES", payload);
    }
  },
  getters: {
    getCableCount(state) {
      return `Il y a ${state.cables.length} cable${
        state.cables.length > 1 ? "s" : ""
      }`;
    }
  }
};
