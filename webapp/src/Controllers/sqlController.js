import mysql from 'mysql2/promise';

// HARD CODED from MySql setup script
const sqlTable = "anatomyinfo"
const firstCol = "ModelTag"
const secondCol = "TextInfo"

// Create the connection to database
const connection = await mysql.createConnection({
  // local or remote
    // host: 'localhost',
    // host: 'mysql.us.stackcp.com',
    host: 'database-1.ct2csa0oitno.us-east-2.rds.amazonaws.com',

  // local
    // user: 'root',
    // password: 'MhYOd#Id&$y$$74l',
    // user: 'BMEAnatomyOne',
    // password: 'anatomyBioMed$77',
    // database: 'anatomy_wiki_db',
  // remote
    // user: 'anatomy_wiki_db-35303934a877',
    // password: 'ivg6s7mcew',
    // database: 'anatomy_wiki_db-35303934a877',
    // port: '39544'
    user: 'BMEAnatomyOne',
    password: 'anatomyBioMed$77',
    database: 'anatomy_wiki_db',
    port: '3306'
});

console.log("Connected to MySQL DB!!!!!")

// Flush local MySql DB
await deleteAllDB();

await resetAutoIncrementDB();


async function writeToDB(mainTag, modelTag, fullTitleText){
    try {
        // Prepared statement
        const sql =
          'INSERT INTO ' + sqlTable + '(`Tags`, '+ firstCol +','+ secondCol +') VALUES (?,?,?)';
        const values = [mainTag, modelTag, fullTitleText];
      
        const [result, fields] = await connection.execute(sql, values);
      
        // console.log(result);
        // console.log(fields);
        // console.log("***** INSERTED new MySql DB Entries: "+ modelTag +" "+ fullTitleText +"*****");
      } catch (err) {
        console.log(err);
      }
}

async function deleteAllDB(){
    try {
        const sql = 'DELETE FROM ' + sqlTable +'';
        // Prepared statement
        const [result, fields] = await connection.execute(sql);
      
        // console.log(result);
        // console.log(fields);
        // console.log("***** DELETED Previous MySql DB Entries *****");
      } catch (err) {
        console.log(err);
      }
}

async function resetAutoIncrementDB(){
    try {
        const sql = 'ALTER TABLE '+ sqlTable +' AUTO_INCREMENT=1;';
        // Prepared statement
        const [result, fields] = await connection.execute(sql);
      
        // console.log(result);
        // console.log(fields);
        // console.log("***** RESET Auto increment MySql DB *****");
      } catch (err) {
        console.log(err);
      }
}

async function updateDB(){
    try {
        const sql =
          'UPDATE `AnatomyInfo` SET `ModelTag` = "B_Sphenoid_Bone" WHERE `ID` = 1 LIMIT 1';
      
        const [result, fields] = await connection.query(sql);
      
        console.log(result);
        console.log(fields);
      } catch (err) {
        console.log(err);
      }
}

export async function querySqlDB(mainTag, modelTag, fullTitleText) {
    //console.log("Writing to MySql database...")
    writeToDB(mainTag, modelTag, fullTitleText);
    //updateDB();
}
