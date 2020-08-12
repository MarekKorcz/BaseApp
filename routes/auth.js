const router = require('express').Router()
const path = require('path');
const { registerAndLoginValidation } = require("./validation/validate")
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { TOKEN_SECRET } = process.env
const User = require('../model/User')
const Log = require('../model/Log')

router.post('/register', async (req, res) => {

    // Validate user before submit to DB
    const { error } = registerAndLoginValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)

    // checking if the user is already in DB
    const userExists = await User.findOne({ name: req.body.name })
    if (userExists) return res.status(400).send("User already exists")

    // generate salt
    const salt = await bcrypt.genSalt(10)

    // hash password
    const hashedPassword = await bcrypt.hash(req.body.password, salt)

    const user = new User({
        name: req.body.name,
        password: hashedPassword
    })

    try {

        const savedUser = await user.save()
        res.send(savedUser)

    } catch (err) {

        res.status(400).send(err)
    }
})

router.get('/login', (req, res) => {

    res.render('auth/login')
})

router.post('/login', async (req, res) => {

    req.body = twistKeyNames(req.body)

    let data = {
        status: 'error'
    }

    // validate user data
    const { error } = registerAndLoginValidation(req.body)
    if (error) {

        data.message = error.details[0].message
        return res.status(400).send(data)
    }

    // check if user exists
    const user = await User.
        findOne({ name: req.body.name })
        .populate('loggs')

    if (!user) {

        data.message = 'User is not found'
        return res.status(400).send(data)
    }

    // check if password is correct
    const validPassword = await bcrypt.compare(req.body.password, user.password)
    if (!validPassword) {

        data.message = 'Invalid password'
        return res.status(400).send(data)
    }

    

    // Log.deleteMany({'user': user._id}, function(error, result) {
    //     console.log(`deleteManyError :  ${error}`)
    //     console.log(`deleteManyResult :  ${result}`)
    // })

    let loggs = Log.find({
        'user': user._id
    }, function (error, results) {

        // console.log(results)

        if (results.length) {

            // get last log
            let lastLog = results.slice(results.length - 1)[0]

            // console.log(`lastLog :   ${lastLog}`)

            // check if it exists
            if (lastLog) {

                // now in seconds from 1970
                let now = Date.now()
                let nowInSeconds = Math.floor(now / 1000)

                // last login in seconds from 1970
                let lastLoginInSeconds = Math.floor(lastLog.date.getTime() / 1000)

                // console.log(nowInSeconds - lastLoginInSeconds <= 60)
                // console.log(nowInSeconds, lastLoginInSeconds)
                // console.log(nowInSeconds - lastLoginInSeconds)

                // check if last log try do not exceed 60 sec
                if (nowInSeconds - lastLoginInSeconds <= 60) {

                    // console.log('last log has been present in less than 60 seconds')

                    // increase attemp counter only when executing second and third log in try
                    if (lastLog.attempt < 3) {

                        // console.log('log attempt number increased')

                        lastLog.attempt = lastLog.attempt + 1
                    }

                    // opens only when thrid log try
                    if (lastLog.attempt == 3) {

                        // console.log('can log in after third try')

                        // create and assign a token
                        data.token = jwt.sign({ _id: user._id }, TOKEN_SECRET, { expiresIn: '1h' })
                        data.status = 'success'

                        lastLog.attempt = 0
                    }

                    // refresh log try time after second and thrid try
                    lastLog.date = Date.now()
                    lastLog.save()

                } else {

                    // console.log('Log exceeds given time to log in, need to create new log with a new (fresh) time')
    
                    createLog(user)
                }
            }

        } else {

            // console.log('There is no log, need to create new one (first one)')

            createLog(user)
        }
    })

    res.send(data)
})

module.exports = router


function twistKeyNames(data) {

    data.name = data.email
    delete data.email

    return data
}

function createLog(user) {

    let log = new Log({
        user: user._id
    })

    log.save()

    // console.log(`Log has been created:  ${log}`)
    
    return log
}