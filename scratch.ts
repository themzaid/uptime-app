import { neon } from '@neondatabase/serverless';
const sql = neon("postgresql://neondb_owner:npg_za7lZnt8TMCw@ep-gentle-butterfly-azlgl4j3-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require");
async function test() {
  try {
    const res = await sql`SELECT 1 as result`;
    console.log("DB Success:", res);
  } catch (e) {
    console.error("DB Error:", e);
  }
}
test();
