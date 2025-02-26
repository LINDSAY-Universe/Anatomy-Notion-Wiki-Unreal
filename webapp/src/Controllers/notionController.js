import { Client } from "@notionhq/client"
import { config } from "dotenv"

config()

import { querySqlDB } from "./sqlController.js";
import { response } from "express";

const pageId = process.env.NOTION_PAGE_ID
const apiKey = process.env.NOTION_KEY

const notion = new Client({ auth: apiKey })

const databaseId = "16cb144fbbc5808f953df3f9266e75a9"

const systemTag = "Skeletal"
//const mainTag = "Skull"
const mainTag = ""
const systemList = ["Skeletal", "Muscular", "Nervous"]
//const mainLists = [["Skull", "Spinal", ""]]
var systemCount = 0;

let fullBodyText = "";

/* 
---------------------------------------------------------------------------
*/

async function queryDatabase(databaseId, system) {
  console.log("Querying Notion database...")
  // This query will filter database entries and return pages that match. Use multiple filters with the AND/OR options: https://developers.notion.com/reference/post-database-query-filter.
  const anatomyWikiDB = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: "Tags",
      multi_select: {
        contains: system,
        //contains: mainTag,
      },
      // property: "Model Tags",
      // multi_select: {
      //   contains: "B_Sphenoid_Bone",
      // },
    },
  })

  await Promise.all(anatomyWikiDB.results.map(async page => {
    // Page ID
    console.log("Page ID: " + page.id);

    // Model Tags
    await Promise.all(page.properties['Model Tags'].multi_select.map(model_tag_name => {
      var modelTag = model_tag_name.name;
      console.log("Model Tag Name: " + modelTag);

      getPageProperties(page.id, modelTag);

    }));
    //console.log("Page ID: " + page.properties['Model Tags'].multi_select[0].name);

  }));

  //console.log(anatomyWikiDB)

  // var pageIdResult = anatomyWikiDB.results[0].id;
  // console.log("Page ID: "+ pageIdResult);
  // Get Model Tags property name
  // NOTE: this is using the 1st result and does not account for multiple tag names
  // var modelTagName = anatomyWikiDB.results[0].properties['Model Tags'].multi_select[0].name;
  // console.log("Model Tag name: "+modelTagName);

  // Change filter to next system in the systemList
  systemCount++;

  await queryNotionDB();
  //console.log("Query Database #: "+ systemCount);
}

async function getPageProperties(pageid, modelTag) {

  const response = await notion.pages.retrieve({ page_id: pageid });

  const pageContent = await notion.blocks.retrieve({
    block_id: pageid,
  });

  //console.log(response);

  if(pageContent.has_children){
    const response = await notion.blocks.children.list({
      block_id: pageid,
      page_size: 50,
    });

    // Check for SyncBlock content
    let syncedBlockID = response.results[0]?.synced_block?.synced_from?.block_id;
    if(syncedBlockID != null){
      console.log("BLOCK_ID: "+syncedBlockID);

        const response = await notion.blocks.children.list({
          block_id: syncedBlockID,
          page_size: 50,
        });

        for(const itemIndex in response.results){
          console.log("OBJECT:"+itemIndex);

          if(response.results[itemIndex]?.paragraph != null)
          {
            console.log("PARAGRAPH!!!");
            try {
              let paragraphText = response.results[itemIndex].paragraph.rich_text[0].plain_text;
            } catch (error) {
              continue;
            }
            console.log("Paragraph PLAIN_TXT: "+ response.results[itemIndex].paragraph.rich_text[0].plain_text);
            fullBodyText = fullBodyText + response.results[itemIndex].paragraph.rich_text[0].plain_text + "\n";
          }
          else if(response.results[itemIndex]?.bulleted_list_item != null)
          {
            console.log("BULLET POINT!!!");
            console.log("Bullet PLAIN_TXT: "+ "• " + response.results[itemIndex].bulleted_list_item.rich_text[0].plain_text); 
            fullBodyText = fullBodyText + "• " + response.results[itemIndex].bulleted_list_item.rich_text[0].plain_text + "\n";
          }
        }
      }
      
    // console.log(response.results[0].synced_block);
    // if(blockInfo != null){
    //   let syncedFrom = blockInfo.synced_from;
    //   console.log("SYNCED_FROM: "+blockInfo.synced_from);
    //   for(const item in syncedFrom){
    //     if(item == "block_id"){
    //       console.log("BLOCK_ID: "+blockInfo.synced_from.block_id);
    //     }
    //   }
    //   //console.log("BLOCK_ID: "+syncedFrom.block_id);      
    // }
    // console.log(response.results[0].synced_block.synced_from);
    // console.log(response.results[1].paragraph);
    //console.log(response.results[0].synced_block.synced_from.block_id);
    // const response_synced = await notion.blocks.children.list({
    //   block_id: response.results[0].synced_block.synced_from.block_id,
    //   page_size: 50,
    // });
    // console.log(response_synced);
  }

  // Get and format title text
  var fullTitleText = "";
  Promise.all(response.properties.Page.title.map(async page => {
    fullTitleText = fullTitleText + page.plain_text;
  }));

  console.log("FULL BODY TEXT: "+ fullBodyText);

  if(fullBodyText != ""){
    fullTitleText = fullBodyText;
  }

  // Write fetched Notion info to MySql DB
  querySqlDB(mainTag, modelTag, fullTitleText);

  console.log("Page title: " + fullTitleText);

  fullBodyText = "";

  //console.log("Page title: " + response.properties.Page.title[0].plain_text);
}

export async function queryNotionDB() {
  if (systemCount < systemList.length) {
    let system = systemList[systemCount];
    await queryDatabase(databaseId, system);
  }
}