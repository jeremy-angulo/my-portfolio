import { Game } from './Game.js'
import { lang, t, toggleLang } from './I18n.js'

export class Options
{
    constructor()
    {
        this.game = Game.getInstance()
        this.element = this.game.menu.items.get('options').contentElement

        this.setSound()
        this.setQuality()
        this.setRespawn()
        this.setReset()
        this.setRenderer()
        this.setLanguage()
    }

    setSound()
    {
        const element = this.element.querySelector('.js-audio-toggle')

        element.addEventListener('click', this.game.audio.mute.toggle)
    }

    setQuality()
    {
        const element = this.element.querySelector('.js-quality-toggle')
        const text = element.querySelector('span')
        const update = () =>
        {
            const name = [ t('High', 'Élevée'), t('Medium', 'Moyenne'), t('Low', 'Basse') ][this.game.quality.level]

            // En automatique on montre le palier retenu entre parenthèses : le
            // joueur voit ce que sa machine a obtenu, sans avoir à le choisir.
            text.textContent = this.game.quality.auto ? `${t('Auto', 'Auto')} (${name})` : name
        }
        update()

        element.addEventListener('click', () =>
        {
            // Auto → Élevée → Moyenne → Basse → Auto
            if(this.game.quality.auto)
                this.game.quality.changeLevel(0, true)
            else if(this.game.quality.level < 2)
                this.game.quality.changeLevel(this.game.quality.level + 1, true)
            else
                this.game.quality.enableAuto()

            // changeLevel n'émet rien quand le palier ne bouge pas (Auto élevé
            // vers Élevée manuel, par exemple) : on rafraîchit le libellé ici.
            update()
        })

        this.game.quality.events.on('change', update)
    }

    setRespawn()
    {
        const element = this.element.querySelector('.js-respawn')

        element.addEventListener('click', () =>
        {
            this.game.player.respawn()
            this.game.menu.close()
        })
    }

    setReset()
    {
        const element = this.element.querySelector('.js-reset')

        element.addEventListener('click', () =>
        {
            this.game.reset()
            this.game.menu.close()
        })
    }

    setRenderer()
    {
        if(this.game.rendering.renderer.backend.isWebGLBackend)
        {
            const element = this.element.querySelector('.js-renderer')
            element.classList.remove('is-success')
            element.classList.add('is-danger')

            const text = element.querySelector('span')
            text.textContent = 'WebGL'

            const tooltip = element.querySelector('.js-tooltip')
            tooltip.innerHTML = t(
                /* html */`Your browser is <strong>not compatible</strong> with WebGPU resulting in performance loss`,
                /* html */`Ton navigateur n'est <strong>pas compatible</strong> WebGPU, les performances seront réduites`
            )
        }
    }

    setLanguage()
    {
        const element = this.element.querySelector('.js-lang-toggle')
        const text = element.querySelector('span')
        text.textContent = lang === 'fr' ? 'Français' : 'English'

        element.addEventListener('click', () =>
        {
            toggleLang()
        })
    }
}
