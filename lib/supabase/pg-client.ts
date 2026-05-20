import { Pool } from 'pg'

let pool: Pool | null = null

function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL })
  return pool
}

class QueryBuilder {
  private _table: string
  private _op: 'select' | 'insert' = 'select'
  private _columns = '*'
  private _insertData: Record<string, unknown> | null = null
  private _conditions: Array<{ col: string; val: unknown }> = []
  private _order: Array<{ col: string; asc: boolean }> = []
  private _single = false

  constructor(table: string) {
    this._table = table
  }

  select(columns = '*') {
    this._columns = columns
    return this
  }

  order(col: string, { ascending = true } = {}) {
    this._order.push({ col, asc: ascending })
    return this
  }

  eq(col: string, val: unknown) {
    this._conditions.push({ col, val })
    return this
  }

  insert(data: Record<string, unknown>) {
    this._op = 'insert'
    this._insertData = data
    return this
  }

  single() {
    this._single = true
    return this
  }

  then(
    onfulfilled?: ((v: unknown) => unknown) | null,
    onrejected?: ((r: unknown) => unknown) | null,
  ) {
    return this._run().then(onfulfilled, onrejected)
  }

  private async _run(): Promise<{ data: unknown; error: unknown }> {
    const db = getPool()
    try {
      if (this._op === 'insert') {
        const cols = Object.keys(this._insertData!)
        const vals = Object.values(this._insertData!)
        const ph = vals.map((_, i) => `$${i + 1}`)
        const sql = `INSERT INTO ${this._table} (${cols.join(', ')}) VALUES (${ph.join(', ')}) RETURNING *`
        const res = await db.query(sql, vals)
        const row = this._single ? (res.rows[0] ?? null) : res.rows
        return { data: row, error: null }
      }

      const params: unknown[] = []
      let sql = `SELECT ${this._columns} FROM ${this._table}`
      if (this._conditions.length) {
        const where = this._conditions.map((c, i) => {
          params.push(c.val)
          return `${c.col} = $${i + 1}`
        })
        sql += ` WHERE ${where.join(' AND ')}`
      }
      if (this._order.length) {
        sql += ` ORDER BY ${this._order.map(o => `${o.col} ${o.asc ? 'ASC' : 'DESC'}`).join(', ')}`
      }
      const res = await db.query(sql, params)
      const data = this._single ? (res.rows[0] ?? null) : res.rows
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  }
}

export function createPgClient() {
  return {
    from: (table: string) => new QueryBuilder(table),
  }
}
