'use client';

import * as React from 'react';
import NextImage, { type ImageProps } from 'next/image';
import clsx from 'clsx';

/**
 * Wrapper minimal et robuste autour de next/image avec compat v1.
 *
 * Choses gérées:
 * - `fill`: on rend un wrapper `relative` en conservant les classes du wrapper.
 * - Compat props historiques: `wrapperClass` et `imgClassName` (alias de
 *   `wrapperClassName` et `className`).
 * - Visibilité par défaut: si aucune classe d'opacité n'est fournie, on force
 *   `opacity-100` pour éviter les images invisibles avec des styles hérités.
 * - `sizes` par défaut quand `fill` est vrai.
 */

type SmartImageProps = Omit<ImageProps, 'src' | 'alt' | 'className'> & {
  src: string;
  alt: string;
  /** classes sur le conteneur quand on utilise fill */
  wrapperClassName?: string;
  /** alias v1 */
  wrapperClass?: string;
  /** classes sur l'image */
  className?: string;
  /** alias v1 */
  imgClassName?: string;
};

function hasExplicitOpacity(className?: string) {
  if (!className) return false;
  // recherche grossière d'une classe Tailwind d'opacité
  return /(\s|^)(opacity-\d+|\[opacity:|\bopacity-\[)/.test(className);
}

export default function SmartImage(props: SmartImageProps) {
  const {
    // compat alias
    wrapperClassName,
    wrapperClass,
    className,
    imgClassName,
    fill,
    alt,
    src,
    sizes,
    onContextMenu,
    onDragStart,
    ...rest
  } = props;

  const handleContextMenu = (event: React.MouseEvent<HTMLImageElement>) => {
    event.preventDefault();
    onContextMenu?.(event);
  };

  const handleDragStart = (event: React.DragEvent<HTMLImageElement>) => {
    event.preventDefault();
    onDragStart?.(event);
  };

  const wrapperClasses = wrapperClassName ?? wrapperClass;

  // fusionne classes image (alias)
  const rawImgClasses = imgClassName ?? className;
  const imgClasses = clsx(
    // assure une boîte visible
    'block',
    // pour les cas fill on privilégie object-contain qui matche la plupart des grids
    fill ? 'object-contain' : undefined,
    rawImgClasses,
    // si aucune opacité fournie, on force visible par défaut
    !hasExplicitOpacity(rawImgClasses) && 'opacity-100'
  );

  // next/image exige sizes quand fill=true; on met un défaut raisonnable
  const resolvedSizes = fill ? (sizes ?? '100vw') : sizes;

  if (fill) {
    if (!wrapperClasses) {
      return (
        <NextImage
          src={src}
          alt={alt}
          fill
          sizes={resolvedSizes}
          className={imgClasses}
          draggable={false}
          data-protect="true"
          onContextMenu={handleContextMenu}
          onDragStart={handleDragStart}
          {...rest}
        />
      );
    }
    return (
      <div className={clsx('relative block w-full h-full', wrapperClasses)}>
        <NextImage
          src={src}
          alt={alt}
          fill
          sizes={resolvedSizes}
          className={imgClasses}
          draggable={false}
          data-protect="true"
          onContextMenu={handleContextMenu}
          onDragStart={handleDragStart}
          {...rest}
        />
      </div>
    );
  }

  return (
    <NextImage
      src={src}
      alt={alt}
      width={1080}
      height={1080}
      sizes={resolvedSizes}
      className={imgClasses}
      draggable={false}
      data-protect="true"
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      {...rest}
    />
  );
}
