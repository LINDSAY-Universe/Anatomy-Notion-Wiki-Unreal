import { Client } from "@notionhq/client"
import { config } from "dotenv"

config()

import { querySqlDB } from "./sqlController.js";
//import express from "express";
import { response } from "express";
//import { slowDown } from 'express-slow-down'

// const app = express();
// const limiter = slowDown({
// 	windowMs: 15 * 60 * 1000, // 15 minutes
// 	delayAfter: 1,
// 	delayMs: (hits) => hits * 3340,
//   handler: (req, res, next) => {
//     console.log(`Delaying request from ${req.ip}`);
//     next();
//   },
// })

// // Apply the delay middleware to all requests.
// app.use(limiter)

const pageId = process.env.NOTION_PAGE_ID
const apiKey = process.env.NOTION_KEY

const notion = new Client({ auth: apiKey })

//const databaseId = "16cb144fbbc5808f953df3f9266e75a9"
const databaseId = "1edb144fbbc580b88cb7de45f5f164c6"

const systemTag = "Skeletal"
//const mainTag = "Skull"
const mainTag = ""
//const systemList = ["Skeletal", "Muscular", "Nervous"]
const systemList = ["Skeletal", "Muscular"]
//const mainLists = [["Skull", "Spinal", ""]]
var systemCount = 0;
var systemComplete = false;
let fullBodyText = "";

/* 
---------------------------------------------------------------------------
*/

// A utility function to create a promise that resolves after a delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const delayMs = 350;
var delayStack = delayMs;
var startTime = 0;

async function queryDatabase(databaseId, system) {
  // This query will filter database entries and return pages that match. Use multiple filters with the AND/OR options: https://developers.notion.com/reference/post-database-query-filter.
  const anatomyWikiDB = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: "Tags",
      multi_select: {
        contains: system,
      },
    },
  })

  let resultCount = 0;
  
  anatomyWikiDB.results.forEach((page) => {

    resultCount++;

    if(resultCount == anatomyWikiDB.results.length)
    {
      console.log("Last Result for " + system +" System is: " + page.id);
    }
    else
    {
      // Page ID
      //console.log("Page ID: " + page.id);
    }

    page.properties['Model Tags'].multi_select.reduce(async (previousPromise, model_tag_name) => {
      await previousPromise;
      var modelTag = model_tag_name.name;
      //console.log("Model Tag Name: " + modelTag);

      getPageProperties(page.id, modelTag);
      // Return a new promise that resolves after the delay for the current item
      return delay(delayMs);
    }, Promise.resolve()) // Start with an immediately resolving promise
    .then(() => {
    console.log("All tasks completed for Page ID: "+page.id);
});

  })

  /*
  await Promise.all(anatomyWikiDB.results.map(async page => {
    // Page ID
    //console.log("Page ID: " + page.id);

    // Model Tags
    let pagePromise = await Promise.all(page.properties['Model Tags'].multi_select.map(model_tag_name => {
      var modelTag = model_tag_name.name;
      //console.log("Model Tag Name: " + modelTag);
      
      getPageProperties(page.id, modelTag);
    })).then(results => {
        //console.log(system + " System QUERY AND WRITE PAGE INFO COMPLETED!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      })
        .catch((error) => {
          console.error(error);
    });

    //console.log("Page ID: " + page.properties['Model Tags'].multi_select[0].name);

  }));
*/

  // Change filter to next system in the systemList
  systemCount++;

  await queryNotionDB();
  //console.log("Query Database #: "+ systemCount);

}

function getPromiseState(promise) {
  let state = "pending";
  promise.then(() => state = "fulfilled", () => state = "rejected");
  return () => state;
}

async function getPageProperties(pageid, modelTag) {

   if(startTime==0){
    startTime = Date.now();
    completionCheck();
   } 

  const response = await notion.pages.retrieve({ page_id: pageid });
  delayStack = delayStack + delayMs;
  //console.log("First Pause: "+pageid+" Time: "+delayStack);
  await delay(delayStack);
  
  const pageContent = await notion.blocks.retrieve({
    block_id: pageid,
  });
  delayStack = delayStack + delayMs;
  // Times by 1.5 to give the aync requests to Notion time to complete
  //console.log("Second Pause: "+pageid+" Time: "+delayStack*1.5);
  await delay(delayStack);
  //console.log(response);

  if(pageContent.has_children){
    const response = await notion.blocks.children.list({
      block_id: pageid,
      page_size: 50,
    });

    // Check for SyncBlock content
    let syncedBlockID = response.results[0]?.synced_block?.synced_from?.block_id;
    if(syncedBlockID != null){
      //console.log("BLOCK_ID: "+syncedBlockID);

        const response = await notion.blocks.children.list({
          block_id: syncedBlockID,
          page_size: 50,
        });

        for(const itemIndex in response.results){
          //console.log("OBJECT:"+itemIndex);

          if(response.results[itemIndex]?.paragraph != null)
          {
            //console.log("PARAGRAPH!!!");
            try {
              let paragraphText = response.results[itemIndex].paragraph.rich_text[0].plain_text;
            } catch (error) {
              continue;
            }
            //console.log("Paragraph PLAIN_TXT: "+ response.results[itemIndex].paragraph.rich_text[0].plain_text);
            fullBodyText = fullBodyText + response.results[itemIndex].paragraph.rich_text[0].plain_text + "\n";
          }
          else if(response.results[itemIndex]?.bulleted_list_item != null)
          {
            //console.log("BULLET POINT!!!");
            //console.log("Bullet PLAIN_TXT: "+ "• " + response.results[itemIndex].bulleted_list_item.rich_text[0].plain_text); 
            fullBodyText = fullBodyText + "• " + response.results[itemIndex].bulleted_list_item.rich_text[0].plain_text + "\n";
          }
        }
      }  
      
  }

  // Get and format title text
  var fullTitleText = "";
  Promise.all(response.properties.Page.title.map(async page => {
    fullTitleText = fullTitleText + page.plain_text;
  }));

  //console.log("FULL BODY TEXT: "+ fullBodyText);

  if(fullBodyText != ""){
    fullTitleText = fullBodyText;
  }

  // Write fetched Notion info to MySql DB
  querySqlDB(mainTag, modelTag, fullTitleText);

  //console.log("Page title: " + fullTitleText);

  fullBodyText = "";

  //console.log("Page title: " + response.properties.Page.title[0].plain_text);

}

export async function queryNotionDB() {
  if (systemCount < systemList.length) {
    let system = systemList[systemCount];
    await queryDatabase(databaseId, system);
  }
}

async function completionCheck(){
    const elapsedTime = Date.now() - startTime + delayMs;
    console.log("Elapsed time: "+elapsedTime/1000+"s");
    // Times by 1.5 to give the aync requests to Notion time to complete
    if(delayStack*1.5 < elapsedTime){
          console.log("Data acquisition from Notion is COMPLETE!!!!!!!!!!!!!!!!!");
    } else {
      await delay(1000);
      completionCheck();
    }
}

