const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql')
const jwt = require('jsonwebtoken')
const app = express()

const secretKey = 'thisisverysecretkey'

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'dagang_buah'
})

db.connect((err) => {
    if (err) throw err
    console.log('Database connected')
})

const isAuthorized = (request, result, next) => {
    if (typeof (request.headers['x-api-key']) == 'undefined') {
        return result.status(403).json({
            success: false,
            message: 'Unauthorized. Token is not provided'
        })
    }

    let token = request.headers['x-api-key']

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return result.status(401).json({
                success: false,
                message: 'Unauthorized. Token is invalid'
            })
        }
    })

    next()
}

app.get('/', (request, result) => {
    result.json({
        success: true,
        message: 'Berhasil Masuk'
    })
})

app.post('/login', (request, result) => {
    let data = request.body

    if (data.username == 'admin' && data.password == 'admin') {
        let token = jwt.sign(data.username + '|' + data.password, secretKey)

        result.json({
            success: true,
            message: 'Berhasil Login, selamat datang admin!',
            token: token
        })
    }

    result.json({
        success: false,
        message: 'Kamu bukan admin!'
    })
})

/* Data Buah */

app.get('/buahs', (request, res) => {
    let sql = `
    select * from buahs
    `

    db.query(sql, (err, result) => {
        if (err) throw err
        res.json({
            success: true,
            message: "Data buah tersedia",
            data: result
        })
    })
})

app.post('/buahs', isAuthorized, (request, result) => {
    let data = request.body

    let sql = `
    insert into buahs (nama_buah, stock, produksi)
    values ('` + data.nama_buah + `', '` + data.stock + `', '` + data.produksi + `');
    `

    db.query(sql, (err, result) => {
        if (err) throw err
    })

    result.json({
        success: true,
        message: 'Data buah berhasil ditambahkan'
    })
})

app.put('/buahs/:id', isAuthorized, (request, result) => {
    let data = request.body

    let sql = `
    update buahs
    set nama_buah = '` + data.nama_buah + `', stock = '` + stock + `', produksi = '` + data.produksi + `'
    where id = ` + request.params.id + `
    `

    db.query(sql, (err, result) => {
        if (err) throw err
    })

    result.json({
        success: true,
        message: 'Data buah berhasil diubah'
    })
})

app.delete('/buahs/:id', isAuthorized, (request, result) => {
    let sql = `
    delete from buahs where id = ` + request.params.id + `
    `

    db.query(sql, (err, result) => {
        if (err) throw err
    })

    result.json({
        success: true,
        message: 'Data buah berhasil dihapus'
    })
})

/*Pembeli*/
app.get('/users', isAuthorized, (req, res) => {
    let sql = `
    select id, username from users
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        result.json({
            message: 'Data pembeli tersedia',
            data: result
        })
    })
})

app.post('/users', isAuthorized, (req, res) => {
    let data = req.body

    let sql = `
    insert into users (username, password)
    values ('` + data.username + `', '` + data.password + `')
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "pembeli dibuat",
            data: result
        })
    })
})

app.get('/users/:id', isAuthorized, (req, res) => {
    let sql = `
    select * from users
    where id = ` + req.params.id + `
    limit 1
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "success get user's detail",
            data: result[0]
        })
    })
})

app.put('/users/:id', isAuthorized, (req, res) => {
    let data = req.body

    let sql = `
    update users
    set username = '` + data.username + `', password = '` + data.password + `'
    where id = '` + req.params.id + `'
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "data has been updated",
            data: result
        })
    })
})

app.delete('/users/:id', isAuthorized, (req, res) => {
    let sql = `
    delete from users
    where id = '` + req.params.id + `'
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "data has been deleted",
            data: result
        })
    })
})

//TRANSAKSI

app.post('/buahs/:id/take', isAuthorized, (req, res) => {
    let data = req.body

    db.query(`
    insert into transaksi (user_id, buah_id)
    values ('` + data.user_id + `', '` + req.params.id + `')
    `, (err, result) => {
        if (err) throw err
    })

    db.query(`
        update buahs
        set stock = stock - 1
        where id = '` + req.params.id + `'
    `, (err, result) => {
        if (err) throw err
    })

    res.json({
        message: "Buahs has been taked by user"
    })
})