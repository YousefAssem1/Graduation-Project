const { timeline, registerPlugin } = gsap;
registerPlugin(MorphSVGPlugin);

document.querySelectorAll('.password-field').forEach(field => {
    let input = field.querySelector('input'),
        button = field.querySelector('button'),
        time = timeline({
            paused: true
        }).to(field.querySelector('svg .top'), {
            morphSVG: 'M2 10.5C2 10.5 6.43686 15.5 10.5 15.5C14.5631 15.5 19 10.5 19 10.5',
            duration: .2
        }).to(field, {
            keyframes: [{
                '--eye-s': 0,
                '--eye-background': 1,
                duration: .2
            }, {
                '--eye-offset': '0px',
                duration: .15
            }]
        }, 0);
    
    button.addEventListener('click', e => {
        e.preventDefault();
        if(field.classList.contains('show')) {
            field.classList.remove('show');
            input.type = 'password';
            time.reverse(0);
        } else {
            field.classList.add('show');
            input.type = 'text';
            time.play(0);
        }
    });
    
    field.addEventListener('pointermove', e => {
        const rect = button.getBoundingClientRect();
        const fullWidth = rect.width;
        const halfWidth = fullWidth / 2;
        const fullHeight = rect.height;
        const halfHeight = fullHeight / 2;
        let x = e.clientX - rect.left - halfWidth,
            y = e.clientY - rect.top - halfHeight;

        field.style.setProperty('--eye-x', (x < -halfWidth ? -halfWidth : x > fullWidth ? fullWidth : x) / 15 + 'px');
        field.style.setProperty('--eye-y', (y < -halfHeight ? -halfHeight : y > fullHeight ? fullHeight : y) / 25 + 'px');
    });
    
    field.addEventListener('pointerleave', e => {
        field.style.setProperty('--eye-x', '0px');
        field.style.setProperty('--eye-y', '0px');
    });
});


document.getElementById('passwordForm').addEventListener('submit', function(e) {
    e.preventDefault();
    checkPassword();
});

function checkPassword() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('cnfrm-password').value;
    const message = document.getElementById('message');
    const confirmInput = document.getElementById('cnfrm-password');
    const form = document.getElementById('passwordForm');

    if (password === '' || confirmPassword === '') {
        message.textContent = "Please fill in the text boxes";
        message.style.backgroundColor = "blue"; 
        confirmInput.style.borderColor = "blue";
        confirmInput.classList.add('vibrate');
        return false; 
    }

    if (password === confirmPassword) {
        message.textContent = "Passwords match!";
        message.style.backgroundColor = "#4CAF50";
        confirmInput.style.borderColor = "#4CAF50";
        confirmInput.classList.remove('vibrate');
        
        // Submit the form after a short delay
        setTimeout(() => {
            form.submit();
        }, 1000);
        return true;
    } else {
        message.textContent = "Password doesn't match";
        message.style.backgroundColor = "red";
        confirmInput.style.borderColor = "red";
        confirmInput.classList.add('vibrate');
        
        setTimeout(() => {
            confirmInput.classList.remove('vibrate');
        }, 500);
        return false;
    }
}