import { supabase } from './supabase'

// Catalogues "standard" : les modèles copiés à l'inscription, un par
// département. Convention du projet : 1 = Son ("Catalogue principal"),
// 2 = Bibliothèque Micros, 12 = Lumière, 13 = Vidéo.
// Lumière et Vidéo existent mais sont encore vides : la copie est alors
// simplement sans effet (catalogue neuf), l'inscription reste fonctionnelle.
export const STANDARD_CATALOG_IDS = { sound: 1, light: 12, video: 13 }

// Copie la liste standard du département (hors micros) dans un nouveau catalogue.
// Repris de CompanySetup.vue pour être réutilisé par l'onboarding.
export async function copyStandardCables(catalogId, dept = 'sound') {
  const sourceId = STANDARD_CATALOG_IDS[dept]
  if (!sourceId) return { copied: 0 }

  const { data: cables } = await supabase
    .from('cable')
    .select('*')
    .eq('catalog_id', sourceId)
    .neq('type', 'microphone')

  if (!cables?.length) return { copied: 0 }

  const toInsert = cables.map((c) => ({
    name: c.name,
    type: c.type,
    brand: c.brand || '',
    sortno: c.sortno || 0,
    weight: c.weight || 0,
    total: c.total || 0,
    reserved: c.reserved || 0,
    info: c.info || '',
    link: c.link || '',
    catalog_id: catalogId,
  }))

  await supabase.from('cable').insert(toInsert)
  return { copied: toInsert.length }
}

const DOMAIN_LABELS = { sound: 'Son', light: 'Lumière', video: 'Vidéo' }

// Freelance solo : un catalogue perso PAR département coché, amorcé avec la
// liste standard du département, + une fiche technicien sans entreprise, le
// tout lié au compte auth.
export async function provisionFreelance({ userId, displayName, email, departments }) {
  const name = (displayName || email || 'Freelance').trim()
  const depts = departments?.length ? departments : ['sound']

  const catalogIds = {}
  for (const dept of depts) {
    const label = DOMAIN_LABELS[dept] || dept
    const { data: cat, error } = await supabase
      .from('catalog')
      .insert({
        name: `${name} — ${label}`,
        owner_name: name,
        description: `${label} — liste personnelle`,
        user_id: userId,
        department: dept,
      })
      .select()
    if (error) return { error }
    catalogIds[dept] = cat[0].catalogid
    await copyStandardCables(cat[0].catalogid, dept)
  }
  // Catalogue primaire = Son si présent, sinon le premier créé
  const primaryCatalogId = catalogIds.sound || Object.values(catalogIds)[0] || null

  const [firstname] = name.split(' ')
  const { data: tech, error: techErr } = await supabase
    .from('technician')
    .insert({
      name,
      firstname: firstname || '',
      email: email || '',
      user_id: userId,
      company_id: null,
      installed: true,
    })
    .select()

  return { catalogId: primaryCatalogId, techId: tech?.[0]?.techid || null, error: techErr }
}

// Entreprise : crée un catalogue par département (amorcé avec le standard du
// département), une fiche technicien "master" (le créateur) et l'entreprise reliée.
export async function provisionCompany({ userId, name, shortName, departments, resp, email }) {
  const depts = departments?.length ? departments : ['sound']

  const catalogIds = {}
  for (const dept of depts) {
    const label = DOMAIN_LABELS[dept] || dept
    const { data: cat } = await supabase
      .from('catalog')
      .insert({
        name: `${name} - ${label}`,
        owner_name: name,
        description: `${label} - ${name}`,
        department: dept,
      })
      .select()
    if (cat?.[0]) {
      catalogIds[dept] = cat[0].catalogid
      await copyStandardCables(cat[0].catalogid, dept)
    }
  }
  // Catalogue primaire = Son si présent, sinon le premier créé
  const firstCatId = catalogIds.sound || Object.values(catalogIds)[0] || null

  // Fiche technicien "master" = le créateur de l'entreprise
  const masterName = resp?.lastname
    ? `${resp.firstname || ''} ${resp.lastname}`.trim()
    : name
  const { data: tech } = await supabase
    .from('technician')
    .insert({
      name: masterName || email,
      firstname: resp?.firstname || '',
      email: email || resp?.email || '',
      user_id: userId,
      can_manage_affairs: true,
      installed: true,
    })
    .select()
  const masterTechId = tech?.[0]?.techid || null

  const { data: co, error } = await supabase
    .from('company')
    .insert({
      name,
      short_name: shortName || '',
      domain: depts.join(','),
      email: email || '',
      resp_firstname: resp?.firstname || '',
      resp_lastname: resp?.lastname || '',
      resp_email: resp?.email || email || '',
      catalog_id: firstCatId,
      master_techid: masterTechId,
    })
    .select()
  const companyId = co?.[0]?.companyid || null

  if (companyId) {
    // Rattacher les catalogues départements et le technicien master à l'entreprise
    const catIds = Object.values(catalogIds).filter(Boolean)
    if (catIds.length) {
      await supabase.from('catalog').update({ company_id: companyId }).in('catalogid', catIds)
    }
    if (masterTechId) {
      await supabase.from('technician').update({ company_id: companyId }).eq('techid', masterTechId)
    }
  }

  return { companyId, catalogId: firstCatId, techId: masterTechId, error }
}
