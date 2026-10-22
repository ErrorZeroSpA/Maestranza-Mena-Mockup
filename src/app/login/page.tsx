'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@mantine/core';
import { Logo } from '@/components/Logo';
import { LoginShowcase } from '@/components/LoginShowcase';
import classes from './login.module.css';

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.1 5.5c4.3-4 6.8-9.9 6.8-16.9z" />
      <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 010-9.4l-7.9-6.1a24 24 0 000 21.6l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.1-5.5c-2 1.4-4.6 2.3-8.8 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  return (
    <div className={classes.stage}>
      <LoginShowcase />

      <section className={classes.panel}>
        <div className={classes.card}>
          <Logo size={52} />
          <h1 className={classes.title}>SGO</h1>
          <p className={classes.sub}>Sistema de Gestión de Operaciones<br />Maestranza Mena</p>
          <Button
            fullWidth
            size="lg"
            color="acero"
            leftSection={<GoogleG />}
            onClick={() => router.push('/inicio')}
            className={classes.btn}
          >
            Iniciar sesión con Google
          </Button>
          <p className={classes.hint}>Acceso solo con cuenta <span>@maestranzamena.com</span></p>
        </div>
        <p className={classes.foot}>Versión mockup · sin autenticación real</p>
      </section>
    </div>
  );
}
