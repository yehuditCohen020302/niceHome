import { useEffect, useState } from 'react';
import type { Design, Product, Room, Store } from '@nice-home/shared';
import { ApiError } from '../../api/client';
import { getDesign, getDesignProducts } from '../../api/designs';
import { getRoom } from '../../api/rooms';

export interface LoadedDesign {
  design: Design;
  room: Room;
  products: Map<string, Product>;
  stores: Map<string, Store>;
}

export type DesignState =
  | { status: 'loading' }
  | { status: 'ready'; data: LoadedDesign }
  | { status: 'not-found' }
  | { status: 'error' };

/** Loads a design together with its room, products and stores. */
export function useDesign(designId: string): DesignState {
  const [state, setState] = useState<DesignState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    setState({ status: 'loading' });

    (async () => {
      const [design, { products, stores }] = await Promise.all([
        getDesign(designId, signal),
        getDesignProducts(designId, signal),
      ]);
      const room = await getRoom(design.roomId, signal);
      setState({
        status: 'ready',
        data: {
          design,
          room,
          products: new Map(products.map((product) => [product.id, product])),
          stores: new Map(stores.map((store) => [store.id, store])),
        },
      });
    })().catch((error: unknown) => {
      if (signal.aborted) return;
      setState({ status: error instanceof ApiError && error.status === 404 ? 'not-found' : 'error' });
    });

    return () => controller.abort();
  }, [designId]);

  return state;
}
