// "Aprenda uma Frase" — mini phrasebook por idioma + ajustes por país.
// Cada frase traz:
//   pt   → o que a gente quer dizer
//   local → como se escreve no idioma local (com script original quando faz sentido)
//   pron  → pronúncia aportuguesada, pra ler batido
//   tip?  → contexto cultural pontual
//
// TTS: bcp47 é usado com window.speechSynthesis pra tocar áudio no dispositivo.
// Se o navegador não tiver a voz do idioma, o botão desabilita silenciosamente.

import type { Country } from "./countries";

export type PhraseCategory =
  | "saudacoes"
  | "cortesia"
  | "mesa"
  | "locomover"
  | "emergencia"
  | "conectar";

export interface Phrase {
  pt: string;
  local: string;
  pron: string;
  tip?: string;
}

export interface Phrasebook {
  langName: string;
  bcp47: string;
  note?: string;
  phrases: Record<PhraseCategory, Phrase[]>;
  fallback?: boolean; // true quando caímos no inglês por falta de base
}

export const CATEGORY_META: Record<
  PhraseCategory,
  { label: string; emoji: string }
> = {
  saudacoes: { label: "Saudações", emoji: "👋" },
  cortesia: { label: "Cortesia", emoji: "🙏" },
  mesa: { label: "Na mesa", emoji: "🍽️" },
  locomover: { label: "Se locomover", emoji: "🚕" },
  emergencia: { label: "Emergência", emoji: "🆘" },
  conectar: { label: "Conectar", emoji: "💬" },
};

// -------------------- Base por idioma (ISO 639-3 do mledoze) --------------------

const BASE: Record<string, Phrasebook> = {
  por: {
    langName: "Português",
    bcp47: "pt-PT",
    note: "Em Portugal, 'pequeno-almoço' é café da manhã e 'casa de banho' é banheiro.",
    phrases: {
      saudacoes: [
        { pt: "Olá", local: "Olá", pron: "o·lá" },
        { pt: "Até logo", local: "Até logo", pron: "a·té ló·go" },
      ],
      cortesia: [
        { pt: "Por favor", local: "Por favor", pron: "por fa·vór" },
        { pt: "Obrigado(a)", local: "Obrigado / Obrigada", pron: "o·bri·gá·do / o·bri·gá·da", tip: "Homem diz obrigado, mulher diz obrigada." },
        { pt: "Desculpe", local: "Desculpe", pron: "des·cúl·pe" },
      ],
      mesa: [
        { pt: "A conta, por favor", local: "A conta, por favor", pron: "a cón·ta por fa·vór" },
        { pt: "Uma água, por favor", local: "Uma água, por favor", pron: "ú·ma á·gua por fa·vór" },
      ],
      locomover: [
        { pt: "Quanto custa?", local: "Quanto custa?", pron: "cuán·to cús·ta" },
        { pt: "Onde fica...?", local: "Onde fica...?", pron: "ón·de fí·ca" },
      ],
      emergencia: [{ pt: "Preciso de ajuda", local: "Preciso de ajuda", pron: "pre·cí·so de a·jú·da" }],
      conectar: [{ pt: "Meu nome é...", local: "Chamo-me...", pron: "chá·mo·me", tip: "Em Portugal usa-se 'Chamo-me' no lugar de 'Meu nome é'." }],
    },
  },

  spa: {
    langName: "Espanhol",
    bcp47: "es-ES",
    phrases: {
      saudacoes: [
        { pt: "Olá", local: "Hola", pron: "ó·la" },
        { pt: "Tchau", local: "Adiós", pron: "a·di·ós" },
      ],
      cortesia: [
        { pt: "Por favor", local: "Por favor", pron: "por fa·vór" },
        { pt: "Obrigado(a)", local: "Gracias", pron: "grá·si·as" },
        { pt: "Com licença / Desculpe", local: "Perdón", pron: "per·dón" },
      ],
      mesa: [
        { pt: "A conta, por favor", local: "La cuenta, por favor", pron: "la cuén·ta por fa·vór" },
        { pt: "Uma cerveja", local: "Una cerveza", pron: "ú·na ser·vé·sa" },
      ],
      locomover: [
        { pt: "Quanto custa?", local: "¿Cuánto cuesta?", pron: "cuán·to cués·ta" },
        { pt: "Onde fica...?", local: "¿Dónde está...?", pron: "dón·de es·tá" },
      ],
      emergencia: [{ pt: "Preciso de ajuda", local: "Necesito ayuda", pron: "ne·se·sí·to a·iú·da" }],
      conectar: [{ pt: "Muito prazer", local: "Mucho gusto", pron: "mú·cho gús·to" }],
    },
  },

  eng: {
    langName: "Inglês",
    bcp47: "en-US",
    phrases: {
      saudacoes: [
        { pt: "Olá", local: "Hello", pron: "rê·lôu" },
        { pt: "Tchau", local: "Goodbye", pron: "gúd·bái" },
      ],
      cortesia: [
        { pt: "Por favor", local: "Please", pron: "plíz" },
        { pt: "Obrigado(a)", local: "Thank you", pron: "ték·iu" },
        { pt: "Com licença", local: "Excuse me", pron: "iks·quiúz·mi" },
      ],
      mesa: [
        { pt: "A conta, por favor", local: "The check, please", pron: "de tchék plíz", tip: "No Reino Unido é 'the bill, please'." },
        { pt: "Uma água", local: "A water", pron: "ê uó·ter" },
      ],
      locomover: [
        { pt: "Quanto custa?", local: "How much is it?", pron: "ráu match iz it" },
        { pt: "Onde fica...?", local: "Where is...?", pron: "uér iz" },
      ],
      emergencia: [{ pt: "Preciso de ajuda", local: "I need help", pron: "ái níd rélp" }],
      conectar: [{ pt: "Prazer em conhecer", local: "Nice to meet you", pron: "náis tu mít·iu" }],
    },
  },

  fra: {
    langName: "Francês",
    bcp47: "fr-FR",
    note: "Começar sempre com 'Bonjour' é regra de ouro — sem isso, atendimento gela.",
    phrases: {
      saudacoes: [
        { pt: "Bom dia / Olá", local: "Bonjour", pron: "bon·jur" },
        { pt: "Tchau", local: "Au revoir", pron: "ô re·voár" },
      ],
      cortesia: [
        { pt: "Por favor", local: "S'il vous plaît", pron: "sil vu plé" },
        { pt: "Obrigado(a)", local: "Merci", pron: "mer·sí" },
        { pt: "Com licença", local: "Excusez-moi", pron: "eks·kiu·zê·moá" },
      ],
      mesa: [
        { pt: "A conta, por favor", local: "L'addition, s'il vous plaît", pron: "la·di·si·on sil vu plé" },
        { pt: "Um vinho tinto", local: "Un verre de vin rouge", pron: "an ver de van rúj" },
      ],
      locomover: [
        { pt: "Quanto custa?", local: "Combien ça coûte ?", pron: "com·bi·en sá kút" },
        { pt: "Onde fica...?", local: "Où est... ?", pron: "u é" },
      ],
      emergencia: [{ pt: "Preciso de ajuda", local: "J'ai besoin d'aide", pron: "jé be·zoán déd" }],
      conectar: [{ pt: "Prazer", local: "Enchanté(e)", pron: "an·chan·tê" }],
    },
  },

  ita: {
    langName: "Italiano",
    bcp47: "it-IT",
    phrases: {
      saudacoes: [
        { pt: "Oi / Tchau (informal)", local: "Ciao", pron: "tchá·o", tip: "'Ciao' serve pra chegada e despedida entre amigos." },
        { pt: "Bom dia", local: "Buongiorno", pron: "buon·jór·no" },
      ],
      cortesia: [
        { pt: "Por favor", local: "Per favore", pron: "per fa·vó·re" },
        { pt: "Obrigado(a)", local: "Grazie", pron: "grá·tsi·e" },
        { pt: "Com licença", local: "Scusi", pron: "skú·zi" },
      ],
      mesa: [
        { pt: "A conta, por favor", local: "Il conto, per favore", pron: "il cón·to per fa·vó·re" },
        { pt: "Um café", local: "Un caffè", pron: "un ka·fé", tip: "'Caffè' no balcão é sempre espresso curto — cappuccino só até o meio da manhã." },
      ],
      locomover: [
        { pt: "Quanto custa?", local: "Quanto costa?", pron: "cuán·to cós·ta" },
        { pt: "Onde fica...?", local: "Dov'è...?", pron: "do·vé" },
      ],
      emergencia: [{ pt: "Preciso de ajuda", local: "Ho bisogno di aiuto", pron: "ó bi·zô·nho di a·iú·to" }],
      conectar: [{ pt: "Muito prazer", local: "Piacere", pron: "pia·tché·re" }],
    },
  },

  deu: {
    langName: "Alemão",
    bcp47: "de-DE",
    phrases: {
      saudacoes: [
        { pt: "Olá", local: "Hallo", pron: "rá·lô" },
        { pt: "Tchau", local: "Tschüss", pron: "tchüs" },
      ],
      cortesia: [
        { pt: "Por favor", local: "Bitte", pron: "bí·te" },
        { pt: "Obrigado(a)", local: "Danke", pron: "dán·ke" },
        { pt: "Desculpe", local: "Entschuldigung", pron: "ent·xúl·di·gung" },
      ],
      mesa: [
        { pt: "A conta, por favor", local: "Die Rechnung, bitte", pron: "di réc·nung bí·te" },
        { pt: "Uma cerveja", local: "Ein Bier", pron: "áin bír" },
      ],
      locomover: [
        { pt: "Quanto custa?", local: "Wie viel kostet das?", pron: "ví fil kós·tet dás" },
        { pt: "Onde fica...?", local: "Wo ist...?", pron: "vô ist" },
      ],
      emergencia: [{ pt: "Preciso de ajuda", local: "Ich brauche Hilfe", pron: "ich bráu·rê rí·lfe" }],
      conectar: [{ pt: "Prazer", local: "Freut mich", pron: "fróit mich" }],
    },
  },

  jpn: {
    langName: "Japonês",
    bcp47: "ja-JP",
    note: "Uma leve inclinação de cabeça acompanha quase toda saudação — é sinal de respeito.",
    phrases: {
      saudacoes: [
        { pt: "Bom dia", local: "おはようございます (Ohayō gozaimasu)", pron: "o·rá·io go·zai·más" },
        { pt: "Boa tarde / Olá", local: "こんにちは (Konnichiwa)", pron: "kon·ni·tchi·uá" },
      ],
      cortesia: [
        { pt: "Por favor", local: "お願いします (Onegai shimasu)", pron: "o·ne·gái xi·más" },
        { pt: "Muito obrigado", local: "ありがとうございます (Arigatō gozaimasu)", pron: "a·ri·ga·tô go·zai·más" },
        { pt: "Com licença / Desculpe", local: "すみません (Sumimasen)", pron: "su·mi·ma·sén", tip: "'Sumimasen' também chama o garçom sem soar rude." },
      ],
      mesa: [
        { pt: "A conta, por favor", local: "お会計お願いします (Okaikei onegai shimasu)", pron: "o·kai·kê o·ne·gái xi·más" },
        { pt: "Estava delicioso", local: "ごちそうさまでした (Gochisōsama deshita)", pron: "go·tchi·sô·sá·ma dex·tá", tip: "Fala isso ao sair — reconhece o preparo da comida." },
      ],
      locomover: [
        { pt: "Quanto custa?", local: "いくらですか？ (Ikura desu ka?)", pron: "i·ku·rá des·ká" },
        { pt: "Onde fica...?", local: "...はどこですか？ (...wa doko desu ka?)", pron: "uá dó·ko des·ká" },
      ],
      emergencia: [{ pt: "Me ajuda, por favor", local: "助けてください (Tasukete kudasai)", pron: "tas·ké·te ku·da·sái" }],
      conectar: [{ pt: "Prazer em conhecer", local: "はじめまして (Hajimemashite)", pron: "ra·ji·me·máx·te" }],
    },
  },

  zho: {
    langName: "Mandarim",
    bcp47: "zh-CN",
    note: "Mandarim é tonal — o tom muda o significado. Ouvir e imitar vale mais que ler pinyin.",
    phrases: {
      saudacoes: [
        { pt: "Olá", local: "你好 (Nǐ hǎo)", pron: "ní rrão" },
        { pt: "Tchau", local: "再见 (Zàijiàn)", pron: "dzái·jien" },
      ],
      cortesia: [
        { pt: "Por favor", local: "请 (Qǐng)", pron: "tchín" },
        { pt: "Obrigado", local: "谢谢 (Xièxie)", pron: "xié·xie" },
        { pt: "Desculpe", local: "对不起 (Duìbùqǐ)", pron: "duêi·bú·tchi" },
      ],
      mesa: [
        { pt: "A conta, por favor", local: "买单 (Mǎidān)", pron: "mái·dan" },
        { pt: "Sem picante", local: "不要辣 (Bùyào là)", pron: "bú·iao lá", tip: "Essencial em Sichuan e Hunan se você não curte pimenta." },
      ],
      locomover: [
        { pt: "Quanto custa?", local: "多少钱？ (Duōshǎo qián?)", pron: "duô·xão tchién" },
        { pt: "Onde fica...?", local: "...在哪里？ (...zài nǎlǐ?)", pron: "dzái ná·li" },
      ],
      emergencia: [{ pt: "Preciso de ajuda", local: "我需要帮助 (Wǒ xūyào bāngzhù)", pron: "uó xu·iao bang·jú" }],
      conectar: [{ pt: "Meu nome é...", local: "我叫... (Wǒ jiào...)", pron: "uó jiáo" }],
    },
  },

  kor: {
    langName: "Coreano",
    bcp47: "ko-KR",
    phrases: {
      saudacoes: [
        { pt: "Olá (formal)", local: "안녕하세요 (Annyeonghaseyo)", pron: "an·nhon·rá·sê·io" },
        { pt: "Tchau (para quem fica)", local: "안녕히 계세요 (Annyeonghi gyeseyo)", pron: "an·nhon·ri gué·sê·io" },
      ],
      cortesia: [
        { pt: "Por favor / Obrigado", local: "감사합니다 (Gamsahamnida)", pron: "gam·sá·ram·ni·da" },
        { pt: "Desculpe", local: "죄송합니다 (Joesonghamnida)", pron: "tchué·son·ram·ni·da" },
      ],
      mesa: [
        { pt: "A conta, por favor", local: "계산해 주세요 (Gyesanhae juseyo)", pron: "gué·san·rê tchu·sê·io" },
        { pt: "Está delicioso", local: "맛있어요 (Masisseoyo)", pron: "ma·xí·so·io" },
      ],
      locomover: [
        { pt: "Quanto custa?", local: "얼마예요? (Eolmayeyo?)", pron: "ól·ma·iê·io" },
        { pt: "Onde fica...?", local: "...어디예요? (...eodiyeyo?)", pron: "ó·di·iê·io" },
      ],
      emergencia: [{ pt: "Me ajuda!", local: "도와주세요! (Dowajuseyo!)", pron: "do·uá·tchu·sê·io" }],
      conectar: [{ pt: "Prazer em conhecer", local: "반갑습니다 (Bangapseumnida)", pron: "ban·gáp·sim·ni·da" }],
    },
  },

  ara: {
    langName: "Árabe",
    bcp47: "ar-SA",
    note: "Escrita da direita pra esquerda. 'Inshallah' (se Deus quiser) fecha quase toda combinação.",
    phrases: {
      saudacoes: [
        { pt: "A paz esteja com você", local: "السلام عليكم (As-salāmu ʿalaykum)", pron: "as·sa·lá·mu a·lái·kum" },
        { pt: "Olá", local: "مرحبا (Marḥaban)", pron: "már·ra·ban" },
      ],
      cortesia: [
        { pt: "Por favor", local: "من فضلك (Min faḍlik)", pron: "min fád·lik" },
        { pt: "Obrigado", local: "شكرا (Shukran)", pron: "xúc·ran" },
        { pt: "Desculpe", local: "آسف (Āsif)", pron: "á·sif" },
      ],
      mesa: [
        { pt: "A conta, por favor", local: "الحساب من فضلك (Al-ḥisāb min faḍlik)", pron: "al·ri·sáb min fád·lik" },
        { pt: "Uma água", local: "ماء من فضلك (Māʾ min faḍlik)", pron: "má min fád·lik" },
      ],
      locomover: [
        { pt: "Quanto custa?", local: "بكم؟ (Bikam?)", pron: "bi·kám" },
        { pt: "Onde fica...?", local: "أين...؟ (Ayna...?)", pron: "ái·na" },
      ],
      emergencia: [{ pt: "Preciso de ajuda", local: "أحتاج مساعدة (Aḥtāj musāʿada)", pron: "a·rí·tach mu·sá·a·da" }],
      conectar: [{ pt: "Meu nome é...", local: "اسمي... (Ismī...)", pron: "ís·mi" }],
    },
  },

  rus: {
    langName: "Russo",
    bcp47: "ru-RU",
    phrases: {
      saudacoes: [
        { pt: "Olá", local: "Здравствуйте (Zdravstvuyte)", pron: "zdrás·tvui·tie" },
        { pt: "Tchau", local: "До свидания (Do svidaniya)", pron: "da svi·dá·nia" },
      ],
      cortesia: [
        { pt: "Por favor", local: "Пожалуйста (Pozhaluysta)", pron: "pa·já·lui·sta" },
        { pt: "Obrigado(a)", local: "Спасибо (Spasibo)", pron: "spa·sí·ba" },
        { pt: "Desculpe", local: "Извините (Izvinite)", pron: "iz·vi·ní·tie" },
      ],
      mesa: [
        { pt: "A conta, por favor", local: "Счёт, пожалуйста (Schyot, pozhaluysta)", pron: "xiót pa·já·lui·sta" },
        { pt: "Um chá", local: "Чай (Chay)", pron: "tchái" },
      ],
      locomover: [
        { pt: "Quanto custa?", local: "Сколько стоит? (Skolko stoit?)", pron: "skól·ka stó·it" },
        { pt: "Onde fica...?", local: "Где...? (Gde...?)", pron: "gdié" },
      ],
      emergencia: [{ pt: "Preciso de ajuda", local: "Помогите (Pomogite)", pron: "pa·ma·guí·tie" }],
      conectar: [{ pt: "Prazer", local: "Очень приятно (Ochen priyatno)", pron: "ó·tchen pri·iát·na" }],
    },
  },

  ell: {
    langName: "Grego",
    bcp47: "el-GR",
    phrases: {
      saudacoes: [
        { pt: "Olá / Oi", local: "Γεια σου (Ya sou)", pron: "iá su", tip: "'Ya sou' pra uma pessoa; 'Ya sas' pra grupo ou formal." },
        { pt: "Tchau", local: "Αντίο (Andío)", pron: "an·dí·o" },
      ],
      cortesia: [
        { pt: "Por favor", local: "Παρακαλώ (Parakaló)", pron: "pa·ra·ka·ló" },
        { pt: "Obrigado(a)", local: "Ευχαριστώ (Efcharistó)", pron: "ef·ka·ris·tó" },
        { pt: "Desculpe", local: "Συγγνώμη (Signómi)", pron: "sig·nó·mi" },
      ],
      mesa: [
        { pt: "A conta, por favor", local: "Τον λογαριασμό, παρακαλώ", pron: "ton lo·ga·ri·az·mó pa·ra·ka·ló" },
        { pt: "Um ouzo", local: "Ένα ούζο (Éna oúzo)", pron: "é·na ú·zo" },
      ],
      locomover: [
        { pt: "Quanto custa?", local: "Πόσο κάνει; (Póso kánei?)", pron: "pó·so ká·ni" },
        { pt: "Onde fica...?", local: "Πού είναι...; (Poú eínai...?)", pron: "pu í·ne" },
      ],
      emergencia: [{ pt: "Preciso de ajuda", local: "Χρειάζομαι βοήθεια", pron: "cri·á·zo·mê vo·í·thia" }],
      conectar: [{ pt: "Prazer", local: "Χαίρω πολύ (Chéro polí)", pron: "ré·ro po·lí" }],
    },
  },

  tur: {
    langName: "Turco",
    bcp47: "tr-TR",
    phrases: {
      saudacoes: [
        { pt: "Olá", local: "Merhaba", pron: "mer·rá·ba" },
        { pt: "Tchau", local: "Hoşça kal", pron: "róx·tcha kál" },
      ],
      cortesia: [
        { pt: "Por favor", local: "Lütfen", pron: "lüt·fén" },
        { pt: "Obrigado", local: "Teşekkür ederim", pron: "te·xe·kür e·de·rim" },
        { pt: "Desculpe", local: "Affedersiniz", pron: "a·fe·der·si·niz" },
      ],
      mesa: [
        { pt: "A conta, por favor", local: "Hesap, lütfen", pron: "re·sáp lüt·fén" },
        { pt: "Um chá", local: "Bir çay", pron: "bir tchái", tip: "Chá turco vem em copinho tulipa — recusar é quase ofensa." },
      ],
      locomover: [
        { pt: "Quanto custa?", local: "Ne kadar?", pron: "ne ka·dár" },
        { pt: "Onde fica...?", local: "...nerede?", pron: "ne·re·dé" },
      ],
      emergencia: [{ pt: "Yardım edin!", local: "Yardım edin!", pron: "iar·dím e·dín" }],
      conectar: [{ pt: "Prazer", local: "Memnun oldum", pron: "mem·nún ol·dúm" }],
    },
  },

  nld: {
    langName: "Holandês",
    bcp47: "nl-NL",
    phrases: {
      saudacoes: [
        { pt: "Olá", local: "Hallo", pron: "rá·lô" },
        { pt: "Tchau", local: "Doei", pron: "dúi" },
      ],
      cortesia: [
        { pt: "Por favor", local: "Alstublieft", pron: "áls·tu·blíft" },
        { pt: "Obrigado", local: "Dank je wel", pron: "dánk ie vél" },
        { pt: "Desculpe", local: "Sorry", pron: "só·ri" },
      ],
      mesa: [
        { pt: "A conta, por favor", local: "De rekening, alstublieft", pron: "de rê·ke·ning áls·tu·blíft" },
        { pt: "Uma cerveja", local: "Een biertje", pron: "en bír·tie" },
      ],
      locomover: [
        { pt: "Quanto custa?", local: "Hoeveel kost het?", pron: "rú·vel kóst ret" },
        { pt: "Onde fica...?", local: "Waar is...?", pron: "vár is" },
      ],
      emergencia: [{ pt: "Preciso de ajuda", local: "Ik heb hulp nodig", pron: "ik rép rúlp nó·dich" }],
      conectar: [{ pt: "Prazer", local: "Aangenaam", pron: "án·ge·nám" }],
    },
  },

  tha: {
    langName: "Tailandês",
    bcp47: "th-TH",
    note: "Homens terminam frases com 'khráp', mulheres com 'khâ' — vira sinal universal de gentileza.",
    phrases: {
      saudacoes: [
        { pt: "Olá", local: "สวัสดี (Sawasdee)", pron: "sa·uát·di khráp / khâ" },
        { pt: "Tchau", local: "ลาก่อน (La kon)", pron: "lá kón" },
      ],
      cortesia: [
        { pt: "Obrigado", local: "ขอบคุณ (Khop khun)", pron: "cóp cún khráp / khâ" },
        { pt: "Desculpe", local: "ขอโทษ (Khor thot)", pron: "kó thót" },
      ],
      mesa: [
        { pt: "A conta, por favor", local: "เช็คบิล (Chek bin)", pron: "tchék bín" },
        { pt: "Sem picante", local: "ไม่เผ็ด (Mai phet)", pron: "mái pét", tip: "Padrão tailandês é bem picante — vale pedir." },
      ],
      locomover: [
        { pt: "Quanto custa?", local: "ราคาเท่าไหร่? (Rakha thaorai?)", pron: "rá·ka tao·rái" },
        { pt: "Onde fica...?", local: "...อยู่ที่ไหน? (...yu thi nai?)", pron: "iú ti nái" },
      ],
      emergencia: [{ pt: "Me ajuda!", local: "ช่วยด้วย! (Chuay duay!)", pron: "tchúai dúai" }],
      conectar: [{ pt: "Prazer em conhecer", local: "ยินดีที่ได้รู้จัก (Yindi thi dai ru chak)", pron: "in·dí ti dái ru tchák" }],
    },
  },

  vie: {
    langName: "Vietnamita",
    bcp47: "vi-VN",
    phrases: {
      saudacoes: [
        { pt: "Olá", local: "Xin chào", pron: "sin tcháo" },
        { pt: "Tchau", local: "Tạm biệt", pron: "tám biét" },
      ],
      cortesia: [
        { pt: "Obrigado", local: "Cảm ơn", pron: "kám ón" },
        { pt: "Desculpe", local: "Xin lỗi", pron: "sin lói" },
      ],
      mesa: [
        { pt: "A conta, por favor", local: "Tính tiền", pron: "tín tién" },
        { pt: "Um cafezinho", local: "Cà phê sữa đá", pron: "ca fé sú·a dá", tip: "Café gelado com leite condensado — clássico vietnamita." },
      ],
      locomover: [
        { pt: "Quanto custa?", local: "Bao nhiêu tiền?", pron: "báo ni·êu tién" },
        { pt: "Onde fica...?", local: "...ở đâu?", pron: "ó dâu" },
      ],
      emergencia: [{ pt: "Me ajuda!", local: "Cứu tôi với!", pron: "kúu toi vói" }],
      conectar: [{ pt: "Prazer", local: "Rất vui được gặp bạn", pron: "rát vui du·ok gap bán" }],
    },
  },

  ind: {
    langName: "Indonésio",
    bcp47: "id-ID",
    phrases: {
      saudacoes: [
        { pt: "Olá / Oi", local: "Halo", pron: "rá·lô" },
        { pt: "Tchau", local: "Selamat tinggal", pron: "se·lá·mat ting·gál" },
      ],
      cortesia: [
        { pt: "Por favor", local: "Tolong", pron: "tô·lóng" },
        { pt: "Obrigado", local: "Terima kasih", pron: "te·rí·ma ká·si" },
        { pt: "Desculpe", local: "Maaf", pron: "má·af" },
      ],
      mesa: [
        { pt: "A conta, por favor", local: "Minta bon", pron: "mín·ta bon" },
        { pt: "Não muito picante", local: "Tidak terlalu pedas", pron: "tí·dak ter·lá·lu pe·dás" },
      ],
      locomover: [
        { pt: "Quanto custa?", local: "Berapa harganya?", pron: "be·rá·pa rar·ga·ña" },
        { pt: "Onde fica...?", local: "Di mana...?", pron: "di má·na" },
      ],
      emergencia: [{ pt: "Me ajuda!", local: "Tolong!", pron: "tô·lóng" }],
      conectar: [{ pt: "Meu nome é...", local: "Nama saya...", pron: "ná·ma sá·ia" }],
    },
  },

  hin: {
    langName: "Hindi",
    bcp47: "hi-IN",
    phrases: {
      saudacoes: [
        { pt: "Saudação (mãos unidas)", local: "नमस्ते (Namaste)", pron: "na·más·te" },
      ],
      cortesia: [
        { pt: "Por favor", local: "कृपया (Kripya)", pron: "kri·pí·ia" },
        { pt: "Obrigado", local: "धन्यवाद (Dhanyavaad)", pron: "dan·ia·vád" },
        { pt: "Desculpe", local: "माफ़ कीजिए (Maaf kijiye)", pron: "má·af kí·ji·ie" },
      ],
      mesa: [
        { pt: "A conta, por favor", local: "बिल दीजिए (Bill dijiye)", pron: "bil dí·ji·ie" },
        { pt: "Não picante", local: "तीखा नहीं (Teekha nahin)", pron: "tí·ka na·rrín" },
      ],
      locomover: [
        { pt: "Quanto custa?", local: "कितने का है? (Kitne ka hai?)", pron: "kít·ne ka rrái" },
        { pt: "Onde fica...?", local: "...कहाँ है? (...kahan hai?)", pron: "ka·rrán rrái" },
      ],
      emergencia: [{ pt: "Me ajuda!", local: "मदद कीजिए! (Madad kijiye!)", pron: "má·dad kí·ji·ie" }],
      conectar: [{ pt: "Meu nome é...", local: "मेरा नाम... है", pron: "mé·ra nám ... rrái" }],
    },
  },

  swe: {
    langName: "Sueco",
    bcp47: "sv-SE",
    phrases: {
      saudacoes: [
        { pt: "Olá", local: "Hej", pron: "rrei" },
        { pt: "Tchau", local: "Hej då", pron: "rrei dô" },
      ],
      cortesia: [
        { pt: "Por favor", local: "Snälla", pron: "snél·la" },
        { pt: "Obrigado", local: "Tack", pron: "tak" },
        { pt: "Desculpe", local: "Förlåt", pron: "för·lót" },
      ],
      mesa: [
        { pt: "A conta, por favor", local: "Notan, tack", pron: "nó·tan tak" },
        { pt: "Uma fika", local: "En fika", pron: "en fí·ka", tip: "'Fika' é a pausa social com café e doce — instituição sueca." },
      ],
      locomover: [
        { pt: "Quanto custa?", local: "Vad kostar det?", pron: "vad kós·tar dét" },
        { pt: "Onde fica...?", local: "Var är...?", pron: "var ér" },
      ],
      emergencia: [{ pt: "Preciso de ajuda", local: "Jag behöver hjälp", pron: "iá be·rrö·ver iélp" }],
      conectar: [{ pt: "Prazer", local: "Trevligt att träffas", pron: "trév·lit at tré·fas" }],
    },
  },

  nor: {
    langName: "Norueguês",
    bcp47: "nb-NO",
    phrases: {
      saudacoes: [
        { pt: "Olá", local: "Hei", pron: "rrei" },
        { pt: "Tchau", local: "Ha det", pron: "rrá dé" },
      ],
      cortesia: [
        { pt: "Por favor", local: "Vær så snill", pron: "vér so snil" },
        { pt: "Obrigado", local: "Takk", pron: "tak" },
        { pt: "Desculpe", local: "Unnskyld", pron: "ún·xild" },
      ],
      mesa: [
        { pt: "A conta, por favor", local: "Regningen, takk", pron: "rê·ning·en tak" },
        { pt: "Uma cerveja", local: "En øl", pron: "en öl" },
      ],
      locomover: [
        { pt: "Quanto custa?", local: "Hvor mye koster det?", pron: "vor mí·e kós·ter dét" },
        { pt: "Onde fica...?", local: "Hvor er...?", pron: "vor ér" },
      ],
      emergencia: [{ pt: "Preciso de ajuda", local: "Jeg trenger hjelp", pron: "iái tré·ner iélp" }],
      conectar: [{ pt: "Prazer", local: "Hyggelig å møte deg", pron: "rrü·ge·li o mö·te dái" }],
    },
  },

  dan: {
    langName: "Dinamarquês",
    bcp47: "da-DK",
    phrases: {
      saudacoes: [
        { pt: "Olá", local: "Hej", pron: "rrái" },
        { pt: "Tchau", local: "Farvel", pron: "far·vél" },
      ],
      cortesia: [
        { pt: "Por favor", local: "Vær venlig", pron: "vér vén·li" },
        { pt: "Obrigado", local: "Tak", pron: "tak" },
        { pt: "Desculpe", local: "Undskyld", pron: "ún·skül" },
      ],
      mesa: [
        { pt: "A conta, por favor", local: "Regningen, tak", pron: "rái·ning·en tak" },
        { pt: "Um smørrebrød", local: "Et smørrebrød", pron: "et smör·re·bröd", tip: "Sanduíche aberto dinamarquês — pedir um variado no almoço é regra." },
      ],
      locomover: [
        { pt: "Quanto custa?", local: "Hvor meget koster det?", pron: "vor mái·et kós·ter dét" },
        { pt: "Onde fica...?", local: "Hvor er...?", pron: "vor ér" },
      ],
      emergencia: [{ pt: "Preciso de ajuda", local: "Jeg har brug for hjælp", pron: "iái ra bru for iélp" }],
      conectar: [{ pt: "Prazer", local: "Rart at møde dig", pron: "rart at mö·de dái" }],
    },
  },

  fin: {
    langName: "Finlandês",
    bcp47: "fi-FI",
    phrases: {
      saudacoes: [
        { pt: "Olá", local: "Hei", pron: "rrei" },
        { pt: "Tchau", local: "Näkemiin", pron: "né·ke·mín" },
      ],
      cortesia: [
        { pt: "Por favor", local: "Ole hyvä", pron: "ó·le rrü·vé" },
        { pt: "Obrigado", local: "Kiitos", pron: "kí·tos" },
        { pt: "Desculpe", local: "Anteeksi", pron: "án·têk·si" },
      ],
      mesa: [
        { pt: "A conta, por favor", local: "Lasku, kiitos", pron: "lás·ku kí·tos" },
        { pt: "Um café", local: "Kahvi", pron: "káh·vi" },
      ],
      locomover: [
        { pt: "Quanto custa?", local: "Paljonko se maksaa?", pron: "pál·ion·ko se mák·sa" },
        { pt: "Onde fica...?", local: "Missä on...?", pron: "mís·sä on" },
      ],
      emergencia: [{ pt: "Preciso de ajuda", local: "Tarvitsen apua", pron: "tár·vit·sen á·pu·a" }],
      conectar: [{ pt: "Prazer", local: "Hauska tavata", pron: "ráus·ka tá·va·ta" }],
    },
  },

  pol: {
    langName: "Polonês",
    bcp47: "pl-PL",
    phrases: {
      saudacoes: [
        { pt: "Olá", local: "Cześć", pron: "tchéxtch" },
        { pt: "Tchau", local: "Do widzenia", pron: "do vi·dzé·nia" },
      ],
      cortesia: [
        { pt: "Por favor", local: "Proszę", pron: "pró·che" },
        { pt: "Obrigado", local: "Dziękuję", pron: "djen·kú·ie" },
        { pt: "Desculpe", local: "Przepraszam", pron: "pxe·prá·xam" },
      ],
      mesa: [
        { pt: "A conta, por favor", local: "Rachunek, proszę", pron: "ra·rrú·nek pró·che" },
        { pt: "Um pierogi", local: "Pierogi, proszę", pron: "pie·rô·gui pró·che", tip: "Massa recheada polonesa — versão ruskie (batata e queijo) é clássica." },
      ],
      locomover: [
        { pt: "Quanto custa?", local: "Ile to kosztuje?", pron: "í·le to kox·tú·ie" },
        { pt: "Onde fica...?", local: "Gdzie jest...?", pron: "gdjê iést" },
      ],
      emergencia: [{ pt: "Me ajuda!", local: "Pomocy!", pron: "po·mó·tsi" }],
      conectar: [{ pt: "Prazer", local: "Miło mi", pron: "mí·uo mi" }],
    },
  },
};

// -------------------- Overrides por país --------------------
// Ajustes de sotaque (BCP47), notas culturais e frases extras específicas.

interface CountryOverride {
  bcp47?: string;
  note?: string;
  extra?: Partial<Record<PhraseCategory, Phrase[]>>;
}

const COUNTRY_OVERRIDES: Record<string, CountryOverride> = {
  BR: {
    bcp47: "pt-BR",
    note: "No Brasil use 'Oi' em qualquer situação casual e 'obrigado/obrigada' varia com o gênero de quem fala.",
    extra: {
      saudacoes: [
        { pt: "E aí, tudo bem?", local: "E aí, tudo bem?", pron: "i aí tú·do bén" },
      ],
      mesa: [
        { pt: "Uma cerveja gelada", local: "Uma cerveja bem gelada", pron: "ú·ma ser·vé·ja bén je·lá·da", tip: "No Brasil pedir cerveja 'estupidamente gelada' virou clássico." },
      ],
    },
  },
  PT: { bcp47: "pt-PT" },
  US: { bcp47: "en-US" },
  GB: {
    bcp47: "en-GB",
    extra: {
      cortesia: [{ pt: "Muito obrigado", local: "Cheers", pron: "tchírs", tip: "'Cheers' vira 'valeu' ou 'obrigado' no dia a dia britânico." }],
      mesa: [{ pt: "A conta, por favor", local: "The bill, please", pron: "de bíl plíz" }],
    },
  },
  AU: { bcp47: "en-AU", extra: { saudacoes: [{ pt: "E aí, tudo bem?", local: "G'day, mate", pron: "gui·dái méit" }] } },
  IE: { bcp47: "en-IE" },
  CA: { bcp47: "en-CA" },
  MX: {
    bcp47: "es-MX",
    extra: {
      saudacoes: [{ pt: "E aí?", local: "¿Qué onda?", pron: "ké ón·da", tip: "Gíria mexicana super comum entre amigos." }],
      mesa: [{ pt: "Sem picante", local: "Sin picante", pron: "sin pi·kán·te", tip: "'Picante' no México pode ser bem forte — sempre pergunte." }],
    },
  },
  AR: {
    bcp47: "es-AR",
    note: "Na Argentina se usa 'vos' no lugar de 'tú' e o 'll' soa como 'j' brasileiro.",
    extra: {
      saudacoes: [{ pt: "E aí, como vai?", local: "¿Cómo andás?", pron: "kô·mo an·dás" }],
      mesa: [{ pt: "Um mate", local: "Un mate", pron: "un má·te", tip: "Recusar o mate compartilhado é malvisto — aceite pelo menos uma vez." }],
    },
  },
  CL: { bcp47: "es-CL" },
  CO: { bcp47: "es-CO" },
  PE: { bcp47: "es-PE" },
  UY: { bcp47: "es-UY" },
  ES: { bcp47: "es-ES" },
  CH: {
    bcp47: "de-CH",
    note: "Na Suíça alemã, 'Grüezi' substitui 'Hallo' — soa muito mais educado.",
    extra: { saudacoes: [{ pt: "Olá (formal suíço)", local: "Grüezi", pron: "grü·et·si" }] },
  },
  AT: { bcp47: "de-AT", extra: { saudacoes: [{ pt: "Olá (austríaco)", local: "Servus", pron: "sér·vus" }] } },
  BE: { bcp47: "nl-BE" },
  TW: { bcp47: "zh-TW" },
  HK: { bcp47: "zh-HK" },
};

// -------------------- Getter --------------------

function pickPrimaryLangCode(country: Country): string | undefined {
  const codes = country.languages ? Object.keys(country.languages) : [];
  for (const c of codes) if (BASE[c]) return c;
  return codes[0];
}

export function getPhrasebook(country: Country): Phrasebook {
  const code = pickPrimaryLangCode(country);
  const base = code ? BASE[code] : undefined;
  const override = COUNTRY_OVERRIDES[country.cca2];

  if (!base) {
    // Fallback: inglês com aviso, mantendo o app útil pra qualquer país.
    const eng = BASE.eng;
    return {
      ...eng,
      bcp47: override?.bcp47 ?? eng.bcp47,
      note:
        "Não temos base curada pra esse idioma ainda. Frases em inglês costumam funcionar em aeroportos, hotéis e áreas turísticas.",
      fallback: true,
    };
  }

  const merged: Phrasebook = {
    langName: base.langName,
    bcp47: override?.bcp47 ?? base.bcp47,
    note: override?.note ?? base.note,
    phrases: { ...base.phrases },
  };

  if (override?.extra) {
    (Object.keys(override.extra) as PhraseCategory[]).forEach((cat) => {
      const extras = override.extra?.[cat] ?? [];
      merged.phrases[cat] = [...extras, ...(merged.phrases[cat] ?? [])];
    });
  }

  return merged;
}

// Ordena categorias mostrando só as que têm conteúdo.
export function activeCategories(pb: Phrasebook): PhraseCategory[] {
  const order: PhraseCategory[] = [
    "saudacoes",
    "cortesia",
    "mesa",
    "locomover",
    "emergencia",
    "conectar",
  ];
  return order.filter((c) => (pb.phrases[c]?.length ?? 0) > 0);
}
