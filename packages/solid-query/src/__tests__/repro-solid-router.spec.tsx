import { fireEvent, render, screen } from '@solidjs/testing-library'
import { describe, expect, it } from 'vitest'

import { A, Route, Router, Routes } from '@solidjs/router'
import {
  Show,
  Suspense,
  createRenderEffect,
  onCleanup,
  onMount,
} from 'solid-js'
import { QueryCache, QueryClientProvider, createQuery } from '..'
import { createQueryClient } from './utils'

describe('reproduce issue with solid router', () => {
  const queryCache = new QueryCache()
  const queryClient = createQueryClient({ queryCache })

  it('should mount once', async () => {
    const lifecycles = new Array<string>()

    function Page() {
      const query = createQuery(() => ({
        queryKey: [],
        queryFn: () => true,
      }))

      // return <Test data={query.data} />
      return <Show when={query.data}>{(data) => <Test data={data()} />}</Show>
    }

    function Test(props: { data: boolean }) {
      createRenderEffect(() => lifecycles.push('render'))
      onMount(() => lifecycles.push('mount'))
      onCleanup(() => lifecycles.push('cleanup'))

      return <>Page {props.data}</>
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Suspense>
          <Router>
            <Routes>
              <Route path="/" component={() => <A href="/page">link</A>} />
              <Route path="/page" component={Page} />
            </Routes>
          </Router>
        </Suspense>
      </QueryClientProvider>
    ))

    fireEvent.click(screen.getByText('link'))
    await screen.findByText('Page')

    expect(lifecycles).toEqual(['render', 'mount'])
  })
})
