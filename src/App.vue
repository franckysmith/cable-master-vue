<template>
  <div id="nav">
    <router-link to="/">Cablemaster</router-link> |
    <router-link to="/MasterAffaire">MasterAffaire</router-link> |
    <router-link to="/CaisseType">CaisseType</router-link> |
    <router-link to="/about">About</router-link> |
    <router-link to="/Cabletech">Cabletech</router-link>
  </div>
  <router-view />
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin: 0px;
  padding: 0px;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #4dcc59;
}
</style>
