'use client'

import React from 'react';
import { Navbar } from '@nextui-org/react';
import confetti from 'canvas-confetti';
import { Url } from 'next/dist/shared/lib/router/router';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ConfettiButton from './confettiButton';

type Props = {
  links: Url[],
}

export default function VineyardNavbar(props: Props) {
  const currentPage = usePathname();
  return (
    <Navbar css={{
      background: "$background",
    }}>
      <Navbar.Brand>
          <Navbar.Toggle showIn="xs" aria-label="toggle navigation" />
        oh hello
      </Navbar.Brand>
      <Navbar.Content hideIn="xs" >
        {props.links.map((href) => (
        <Navbar.Link key={href.toString()} isActive={currentPage == href} >
          <Link href={href} passHref>
            {href.toString()}
          </Link>
        </Navbar.Link>
      ))}
      </Navbar.Content>
      <Navbar.Content hideIn="xs">
        <ConfettiButton />
      </Navbar.Content>
      <Navbar.Collapse showIn="xs">
      {props.links.map((href) => (
      <Navbar.CollapseItem key={href.toString()} isActive={currentPage == href} >
        <Link href={href} passHref>
          {href.toString()}
        </Link>
      </Navbar.CollapseItem>
    ))}
      </Navbar.Collapse>
    </Navbar>
  );
};
