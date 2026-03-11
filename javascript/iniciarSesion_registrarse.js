const registerBtn = document.getElementById('registerBtn');
        const loginBtn = document.getElementById('loginBtn');
        const mobileRegisterBtn = document.getElementById('mobileRegisterBtn');
        const mobileLoginBtn = document.getElementById('mobileLoginBtn');
        const authWrapper = document.getElementById('authWrapper');

        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                authWrapper.classList.add("panel-active");
            });
        }

        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                authWrapper.classList.remove("panel-active");
            });
        }

        if (mobileRegisterBtn) {
            mobileRegisterBtn.addEventListener('click', () => {
                authWrapper.classList.add("panel-active");
            });
        }

        if (mobileLoginBtn) {
            mobileLoginBtn.addEventListener('click', () => {
                authWrapper.classList.remove("panel-active");
            });
        }