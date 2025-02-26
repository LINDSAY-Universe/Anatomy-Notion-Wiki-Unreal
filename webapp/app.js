import { queryNotionDB } from "./src/Controllers/notionController.js";

async function main(){
    const startApp = await queryNotionDB();
}

main();