import { Events } from './Events.js'
import { Game } from './Game.js'

export class Quality
{
    constructor()
    {
        this.game = Game.getInstance()

        this.events = new Events()

        // iPadOS se présente comme un Safari de bureau depuis iOS 13 : sans le
        // second test, les iPad reçoivent le palier de qualité le plus élevé.
        const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
            || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent))
        this.level = isMobile ? 1 : 0 // 0 = highest quality

        // Debug
        if(this.game.debug.active)
        {
            const debugPanel = this.game.debug.panel.addFolder({
                title: '⚙️ Quality',
                expanded: false,
            })

            this.game.debug.addButtons(
                debugPanel,
                {
                    low: () =>
                    {
                        this.changeLevel(1)
                    },
                    high: () =>
                    {
                        this.changeLevel(0)
                    },
                },
                'change'
            )
        }
    }

    changeLevel(level = 0)
    {
        // Same
        if(level === this.level)
            return
            
        this.level = level
        this.events.trigger('change', [ this.level ])
    }
}