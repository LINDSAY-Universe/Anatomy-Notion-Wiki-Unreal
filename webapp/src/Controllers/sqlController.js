import mysql from 'mysql2/promise';

// HARD CODED from MySql setup script
const sqlTable = "AnatomyInfo"
const firstCol = "ModelTag"
const secondCol = "TextInfo"

// Create the connection to database
const connection = await mysql.createConnection({
    host: 'localhost',
    // user: 'root',
    // password: 'MhYOd#Id&$y$$74l',
    user: 'BMEAnatomyOne',
    password: 'anatomyBioMed$77',
    database: 'anatomy_wiki_db',
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
        console.log("***** INSERTED new MySql DB Entries: "+ modelTag +" "+ fullTitleText +"*****");
      } catch (err) {
        console.log(err);
      }
}

async function deleteAllDB(){
    try {
        const sql = 'DELETE FROM ' + sqlTable +'';
        // Prepared statement
        const [result, fields] = await connection.execute(sql);
      
        console.log(result);
        console.log(fields);
        console.log("***** DELETED Previous MySql DB Entries *****");
      } catch (err) {
        console.log(err);
      }
}

async function resetAutoIncrementDB(){
    try {
        const sql = 'ALTER TABLE '+ sqlTable +' AUTO_INCREMENT=1;';
        // Prepared statement
        const [result, fields] = await connection.execute(sql);
      
        console.log(result);
        console.log(fields);
        console.log("***** RESET Auto increment MySql DB *****");
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
    console.log("Writing to MySql database...")
    writeToDB(mainTag, modelTag, fullTitleText);
    //updateDB();
}
