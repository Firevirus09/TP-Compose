import { createServer } from 'node:http'
import pg from 'pg'

// Les paramètres de connexion viennent des variables PGHOST, PGUSER, PGPASSWORD...
const pool = new pg.Pool()
const port = Number(process.env.PORT ?? 3000)

// Sans cet écouteur, la coupure d'une connexion inactive ferait planter l'API
pool.on('error', (erreur) => console.error('Connexion à la base perdue :', erreur.message))

async function lireCompteur() {
  const { rows } = await pool.query('SELECT valeur FROM compteur WHERE id = 1')
  return rows[0].valeur
}

async function incrementerCompteur() {
  const { rows } = await pool.query(
    'UPDATE compteur SET valeur = valeur + 1 WHERE id = 1 RETURNING valeur',
  )
  return rows[0].valeur
}

async function repondre(req) {
  const route = `${req.method} ${new URL(req.url, 'http://api').pathname}`

  switch (route) {
    case 'GET /api/health':
      await pool.query('SELECT 1')
      return { statut: 200, corps: { api: 'ok', base: 'ok' } }
    case 'GET /api/compteur':
      return { statut: 200, corps: { valeur: await lireCompteur() } }
    case 'POST /api/compteur':
      return { statut: 200, corps: { valeur: await incrementerCompteur() } }
    default:
      return { statut: 404, corps: { erreur: 'Route inconnue' } }
  }
}

const serveur = createServer(async (req, res) => {
  let reponse
  try {
    reponse = await repondre(req)
  } catch (erreur) {
    console.error(erreur)
    reponse = { statut: 503, corps: { erreur: 'Base de données indisponible' } }
  }
  res.writeHead(reponse.statut, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(reponse.corps))
})

await pool.query(`
  CREATE TABLE IF NOT EXISTS compteur (
    id INTEGER PRIMARY KEY,
    valeur INTEGER NOT NULL
  )
`)
await pool.query('INSERT INTO compteur (id, valeur) VALUES (1, 0) ON CONFLICT (id) DO NOTHING')

serveur.listen(port, () => console.log(`API à l'écoute sur le port ${port}`))

// Sans cela, le processus principal d'un conteneur ignore le signal de docker stop
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    serveur.close()
    pool.end().finally(() => process.exit(0))
  })
}
