import DashboardInscripciones from './DashboardInscripciones';

    function App() {
      return (
        <div className="w-full h-full min-h-screen bg-slate-50">
          <DashboardInscripciones />
        </div>
      );
    }

    export default App;
    ```

---

### Fase 5: Subir el código a GitHub (La Nube)

GitHub es como un "Google Drive" para código. Vercel tomará los archivos de aquí.

1.  Crea una cuenta gratuita en [GitHub.com](https://github.com/) si no tienes una.
2.  Crea un **New Repository** (botón verde). Ponle nombre (ej: `dashboard-inscripciones`) y dale a "Create repository".
3.  Vuelve a tu terminal (asegúrate de estar en la carpeta `mi-dashboard`) y ejecuta estos comandos para conectar tu PC con GitHub (copia los comandos que GitHub te muestra en la pantalla, se verán parecidos a estos):

    ```bash
    git init
    git add .
    git commit -m "Primer subida del dashboard"
    git branch -M main
    # El siguiente comando lo copias de tu página de GitHub (empieza con git remote add origin...)
    git remote add origin https://github.com/TU_USUARIO/dashboard-inscripciones.git
    git push -u origin main
    ```

---

### Fase 6: Desplegar en Vercel (Publicar la Web)

1.  Ve a [Vercel.com](https://vercel.com/) y crea una cuenta. **Importante:** Regístrate usando el botón **"Continue with GitHub"**.
2.  En tu panel de Vercel, haz clic en **"Add New..."** -> **"Project"**.
3.  Verás una lista de tus repositorios de GitHub. Busca `dashboard-inscripciones` y haz clic en el botón **"Import"**.
4.  En la siguiente pantalla, no toques nada de la configuración. Solo haz clic en el botón azul **"Deploy"**.
5.  Espera unos segundos (verás confeti en la pantalla).

¡Listo! Vercel te dará un link (Domain) del estilo `dashboard-inscripciones.vercel.app`. **Ese es el link que puedes compartir con cualquiera.**

### ¿Cómo funciona día a día?

1.  Entras a tu link de Vercel.
2.  Verás el dashboard con los datos de ejemplo o vacío.
3.  Haces clic en "Subir CSV Completo", cargas tu archivo del día, y analizas los datos.

### ¿Cómo actualizo el código si quiero cambios?

Si mañana me pides un cambio (ej. "cambiar el color azul a rojo"):
1.  Modificas el archivo en tu computadora.
2.  Abres la terminal y escribes:
    ```bash
    git add .
    git commit -m "Cambié el color a rojo"
    git push
