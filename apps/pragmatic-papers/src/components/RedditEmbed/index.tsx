'use client'

import { fetchRedditEmbed } from "@/utilities/fetchRedditEmbed"
import { useEffect, useState } from "react"

let redditScriptLoaded = false

export const RedditEmbed: React.FC<{
  url?: string
}> = (props) => {

  const [content, setContent] = useState<string>('')

  useEffect(() => {
    if (!props.url) return

    fetchRedditEmbed({ url: props.url })
      .then(res => {
        if (!res) {
          setContent('Reddit post could not be loaded.')
        } else {
          setContent(res.html)

          if (!redditScriptLoaded) {
            // Every 50ms, check if another instance has spawned (id + 1 !== nextId)
            // If not, load the script
            let runs = 0
            const timeoutFunc = () => {
              if (runs < 3) {
                runs++
                setTimeout(timeoutFunc, 50)
              }
              setTimeout(() => {
                redditScriptLoaded = true
                const script = document.createElement('script')
                script.src = "https://embed.reddit.com/widgets.js"
                document.body.appendChild(script)
              }, 50)
            }
            setTimeout(timeoutFunc, 50)
          }
        }
      })
  }, [props.url])

  return (
    <div>
      {/* This shouldn't be dangerous as the HTML is coming from Payload after it's retrieved from the Reddit oEmbed API. */}
      {/* eslint-disable-next-line react/no-danger */}
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  )
}
