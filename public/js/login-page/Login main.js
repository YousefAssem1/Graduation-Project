const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');

registerBtn.addEventListener('click', () => {
    container.classList.add('active');
});

loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
});

/*---------------------------------------------  password input  -----------------------------------------------*/

const { to, set, timeline, registerPlugin } = gsap

registerPlugin(MorphSVGPlugin)

document.querySelectorAll('.password-field').forEach(field => {
    let input = field.querySelectorAll('input'),
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
        }, 0)
    button.addEventListener('click', e => {
        if(field.classList.contains('show')) {
            field.classList.remove('show')
            time.reverse(0)
            return
        }
        field.classList.add('show')
        time.play(0)
    })
    field.addEventListener('pointermove', e => {
        const rect = button.getBoundingClientRect()
        const fullWidth = rect.width
        const halfWidth = fullWidth / 2
        const fullHeight = rect.height
        const halfHeight = fullHeight / 2
        let x = e.clientX - rect.left - halfWidth,
            y = e.clientY - rect.top - halfHeight

        field.style.setProperty('--eye-x', (x < -halfWidth ? -halfWidth : x > fullWidth ? fullWidth : x) / 15 + 'px')
        field.style.setProperty('--eye-y', (y < -halfHeight ? -halfHeight : y > fullHeight ? fullHeight : y) / 25 + 'px')
    })
    field.addEventListener('pointerleave', e => {
        field.style.setProperty('--eye-x', '0px')
        field.style.setProperty('--eye-y', '0px')
    })
    input.forEach(single => single.addEventListener('input', e => input.forEach(i => i.value = e.target.value)))
})



/*-------------------------------------------------  Dark mode  ---------------------------------------------------*/