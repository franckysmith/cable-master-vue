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
/* """""""""""""""""""""""""""""""""""""""""""""""""""""" GENERAL MEDIAS QUERIES """"""""""""""""""""""""""""""""""""""""""""""""" */
/* Extra small devices (phones, 600px and down) */
@media only screen and (max-width: 600px) {
}
/* Small devices (portrait tablets and large phones, 600px and up) */
@media only screen and (min-width: 600px) {
}
/* Medium devices (landscape tablets, 768px and up) */
@media only screen and (min-width: 768px) {
}
/* Large devices (laptops/desktops, 992px and up) */
@media only screen and (min-width: 992px) {
}
/* Extra large devices (large laptops and desktops, 1200px and up) */
@media only screen and (min-width: 1200px) {
}
</style>
