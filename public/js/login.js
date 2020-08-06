document.addEventListener("DOMContentLoaded", () => {

    console.log(document.cookie)


    document.querySelector("form#login a[name=submit]").addEventListener('click', (event) => {

        event.preventDefault

        let email = document.querySelector("[name='email']")
        let isEmailValid = false

        if (email.value == '') {
            
            if(!email.classList.contains("input-error")) {
                
                email.classList.add("input-error")
                isEmailValid = false
            }
            
        } else if (email.value !== '') {
            
            isEmailValid = true
            
            if(email.classList.contains("input-error")) {
            
                email.classList.remove("input-error")
            }
        }

        let password = document.querySelector("[name='password']")
        let isPasswordValid = false

        if (password.value == '') {
            
            if(!password.classList.contains("input-error")) {
                
                password.classList.add("input-error")
                isPasswordValid = false
            }
            
        } else {

            isPasswordValid = true
            
            if (password.classList.contains("input-error")) {
                
                password.classList.remove("input-error")
            }
        }

        if (isEmailValid && isPasswordValid) {

            logIn(email.value, password.value)
        }
    })

    function logIn (email, password) {

        return fetch('http://localhost/login', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-type': 'application/json'
    
                    // figure out a way to protect request in express!!!!
                    // https://stackoverflow.com/questions/34782493/difference-between-csrf-and-x-csrf-token
                },
                body: JSON.stringify({
                    email,
                    password
                })
            })
            .then((res) => res.json())
            .then((data) => {

                if (data.status == "success") {

                    // console.log(data.token)
                    setToken(data.token)
                    
                    
                    // window.location.replace("http://localhost:5000/servers.html")
                }
            });
    }

    function setToken(token) { 

        var now = new Date()
        var time = now.getTime()
        var expireTime = time + 36000
        now.setTime(expireTime)

        document.cookie = `token=${token};expires='${now.toGMTString()}';`
    }
})