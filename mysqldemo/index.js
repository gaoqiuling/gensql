import mysql from 'mysql'
import express from 'express'
const app = express();

const dbInfo = {
    host: 'localhost',
    user: 'root',
    password: '111',
    port: 3306
};

const query = function (sql) {
    let pool = mysql.createPool(dbInfo);
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                connection.query(sql, (error, results, fields) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);
                    }
                    connection.release();
                });
            }
        })
    })
}

const getAllSchemas = async () => {
    let sql = 'SELECT schema_name FROM information_schema.SCHEMATA order by schema_name';
    let result = await query(sql);
    return result.map(t => t.SCHEMA_NAME);
}

const getAllTablesOfSchema = async (schemaName) => {
    let sql = `SELECT TABLE_NAME FROM information_schema.TABLES  WHERE TABLE_SCHEMA = '${schemaName}' order by table_name`;
    let result = await query(sql);
    return result.map(t => t.TABLE_NAME);
}

const getAllColumnsOfTable = async (schemaName, tableName) => {
    let sql = `SELECT COLUMN_NAME as columnName, 
                (case when column_key = 'PRI' then '1' else '0' end) as isPk,
                (case when extra = 'auto_increment' then '1' else '0' end) as isIncrement
               FROM information_schema.COLUMNS  
               where table_schema ='${schemaName}' and table_name = '${tableName}'
               order by ordinal_position`;
    let result = await query(sql);
    return JSON.parse(JSON.stringify(result));
}

app.get('/allSchemas', async function (req, res) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    // 允许的地址,http://127.0.0.1:7000这样的格式
    res.setHeader('Access-Control-Allow-Origin', "*");
    //允许跨域请求的方法
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.json(await getAllSchemas());
});

app.get('/allTablesOfSchema', async function (req, res) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    // 允许的地址,http://127.0.0.1:7000这样的格式
    res.setHeader('Access-Control-Allow-Origin', "*");
    //允许跨域请求的方法
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.json(await getAllTablesOfSchema(req.query.schemaName));
});


app.get('/allColumnsOfTable', async function (req, res) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    // 允许的地址,http://127.0.0.1:7000这样的格式
    res.setHeader('Access-Control-Allow-Origin',"*");
    //允许跨域请求的方法
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.json(await getAllColumnsOfTable(req.query.schemaName, req.query.tableName));
});

app.listen(7001);