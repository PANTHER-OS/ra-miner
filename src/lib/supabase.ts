// Cliente Supabase — usado só pra conta + sincronização na nuvem do
// Passaporte Virtual (ver src/lib/passport.ts). Sem conta, o app continua
// funcionando 100% normal com dados só no localStorage; isso aqui é
// estritamente opcional.
//
// A URL e a chave publicável abaixo NÃO são segredo — é o mesmo padrão já
// usado pra BASE_URL em site.ts. A chave "publishable"/"anon" do Supabase é
// feita pra ir no código do cliente; quem protege os dados de verdade é a
// Row Level Security no banco (ver a tabela `passports`: cada usuário só
// lê/escreve a própria linha), não o sigilo dessa chave.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bxlemuyjwvofcshsfoeo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Yvflz4AasrfJUeyhEbWMzw_Sz1t-MbL";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    // Evita erro no SSR (o servidor não tem localStorage) — no navegador,
    // continua persistindo a sessão normalmente entre recarregamentos.
    persistSession: typeof window !== "undefined",
    autoRefreshToken: typeof window !== "undefined",
  },
});
