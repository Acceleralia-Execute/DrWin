import React from 'react';
import { Button } from './ui/Button';
import { useLanguage } from '../hooks/useLanguage';
import { cn } from '../lib/utils';
import { Combobox } from './ui/Combobox';
import { Label } from './ui/Label';

const StyleGuideSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-16">
    <h2 className="text-3xl font-bold mb-2 text-secondary dark:text-neutral-200">{title}</h2>
    <div className="w-24 h-1 bg-primary mb-8 rounded"></div>
    <div className="space-y-8">
      {children}
    </div>
  </div>
);

const StyleGuideCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-card-foreground">{title}</h3>
        {children}
    </div>
);

const ColorPalette: React.FC<{ title: string; colorName: string; colors: Record<string, string> }> = ({ title, colorName, colors }) => {
    const shades = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
    return (
        <div>
            <h4 className="font-bold text-lg mb-4 capitalize">{title}</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {shades.map(shade => {
                    if (!colors[shade as keyof typeof colors]) return null;
                    return (
                        <div key={shade} className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg bg-${colorName}-${shade} border border-black/10`}></div>
                            <div>
                                <p className="font-semibold text-sm">{shade}</p>
                                <p className="text-xs text-muted-foreground">{colors[shade as keyof typeof colors]}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


const StyleGuide: React.FC = () => {
    const { t } = useLanguage();

    // These colors are from index.html for display purposes
    const colors = {
      primary: { "50": "#FCECF6", "100": "#F7CFE6", "200": "#EFA1CF", "300": "#E072B6", "400": "#D052A5", "500": "#B84E9D", "600": "#9C3C86", "700": "#7F2E6D", "800": "#5F2051", "900": "#3F1335", "950": "#250A20" },
      secondary: { "50": "#ECEFF4", "100": "#CBD4E0", "200": "#A3AEC2", "300": "#7A879F", "400": "#53617B", "500": "#2A3B5A", "600": "#223149", "700": "#1B273B", "800": "#131B29", "900": "#0B1018", "950": "#06090D" },
      tertiary: { "50": "#F3FAEB", "100": "#E0F1D0", "200": "#C4E3A6", "300": "#A8D57D", "400": "#8DC857", "500": "#A3CC71", "600": "#7FB348", "700": "#5E8C35", "800": "#426526", "900": "#294016", "950": "#16230B" },
      destructive: { '50': '#fef2f2', '100': '#fee2e2', '200': '#fecaca', '300': '#fca5a5', '400': '#f87171', '500': '#ef4444', '600': '#dc2626', '700': '#b91c1c', '800': '#991b1b', '900': '#7f1d1d', '950': '#450a0a' },
    };

    const companyNames = [
        "Innovatech Grants EU",
        "Global Funding Partners",
        "Horizon Solutions International",
        "EuroGrant Consultants",
        "Apex Funding Specialists",
        "Nexus International Grants",
        "Quantum Grant Advisors",
        "Stellar Projects EU",
        "Orion International Funding",
        "Meridian Grant Services"
    ];

    return (
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">

            <div className="text-center mb-16">
                <h1 className="text-4xl lg:text-5xl font-extrabold text-primary mb-4">Guía de Estilos y Componentes</h1>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                    Esta es una guía de referencia visual para los componentes, estilos y elementos de la interfaz de usuario disponibles en esta aplicación. Úsala como base para solicitar nuevos cambios o funcionalidades.
                </p>
            </div>

            {/* Typography */}
            <StyleGuideSection title="Tipografía">
                <StyleGuideCard title="Estilos de Texto">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-bold">Título Principal (H1)</h1>
                        <h2 className="text-3xl font-semibold">Título de Sección (H2)</h2>
                        <h3 className="text-2xl font-medium">Subtítulo (H3)</h3>
                        <h4 className="text-xl font-medium">Encabezado Pequeño (H4)</h4>
                        <p className="text-base">
                            Este es un párrafo de texto normal. Se utiliza para la mayoría del contenido escrito. <strong>Texto en negrita</strong> e <i>itálico</i> son fácilmente aplicables. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Texto pequeño o secundario. Ideal para leyendas, metadatos o información complementaria.
                        </p>
                    </div>
                </StyleGuideCard>
            </StyleGuideSection>

            {/* Colors */}
            <StyleGuideSection title="Paleta de Colores">
                <StyleGuideCard title="Colores Principales">
                   <div className="space-y-6">
                     <ColorPalette title="Primario" colorName="primary" colors={colors.primary} />
                     <ColorPalette title="Secundario" colorName="secondary" colors={colors.secondary} />
                     <ColorPalette title="Terciario" colorName="tertiary" colors={colors.tertiary} />
                     <ColorPalette title="Destructivo / Error" colorName="destructive" colors={colors.destructive} />
                   </div>
                </StyleGuideCard>
            </StyleGuideSection>
            
            {/* Buttons */}
            <StyleGuideSection title="Botones">
                <StyleGuideCard title="Variantes y Tamaños">
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-medium mb-3">Variantes</h4>
                            <div className="flex flex-wrap gap-4 items-center">
                                <Button>Default</Button>
                                <Button variant="secondary">Secondary</Button>
                                <Button variant="destructive">Destructive</Button>
                                <Button variant="outline">Outline</Button>
                                <Button variant="ghost">Ghost</Button>
                                <Button variant="link">Link</Button>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-medium mb-3">Tamaños</h4>
                             <div className="flex flex-wrap gap-4 items-center">
                                <Button size="lg">Large</Button>
                                <Button size="default">Default</Button>
                                <Button size="sm">Small</Button>
                                <Button size="icon"><span className="material-symbols-outlined">favorite</span></Button>
                            </div>
                        </div>
                         <div>
                            <h4 className="font-medium mb-3">Con Icono</h4>
                             <div className="flex flex-wrap gap-4 items-center">
                                 <Button>
                                    <span className="material-symbols-outlined mr-2">add_circle</span>
                                    Crear Proyecto
                                 </Button>
                                  <Button variant="outline">
                                    Editar
                                    <span className="material-symbols-outlined ml-2">edit</span>
                                 </Button>
                            </div>
                        </div>
                    </div>
                </StyleGuideCard>
            </StyleGuideSection>

            {/* Interactive Components */}
            <StyleGuideSection title="Componentes Interactivos">
                <StyleGuideCard title="Campo de Autocompletado (Combobox)">
                    <p className="text-muted-foreground mb-4">
                        Este componente muestra una lista predefinida de opciones al hacer foco. La lista se filtra al escribir y, si no se encuentra ninguna coincidencia, se ofrece la opción de añadir el valor introducido.
                    </p>
                    <div className="max-w-md">
                        <Label htmlFor="combobox" className="mb-2 block">Ejemplo: Empresas de Subvenciones Internacionales</Label>
                        <Combobox 
                            items={companyNames}
                            placeholder="Buscar o añadir empresa..."
                        />
                    </div>
                </StyleGuideCard>
            </StyleGuideSection>

            {/* Cards */}
            <StyleGuideSection title="Tarjetas (Cards)">
                 <StyleGuideCard title="Ejemplo de Tarjeta">
                    <p className="text-muted-foreground mb-4">Las tarjetas se usan para agrupar contenido relacionado de forma clara y visualmente atractiva.</p>
                    <div className="w-full md:w-1/2 lg:w-1/3">
                        <div className="bg-background dark:bg-neutral-800 rounded-2xl p-6 h-full border border-border text-center group shadow-md hover:shadow-xl transition-shadow duration-300">
                            <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4 bg-quaternary">
                                <span className="material-symbols-outlined text-secondary" style={{ fontSize: "2rem" }}>widgets</span>
                            </div>
                            <h3 className="uppercase text-lg font-bold mb-2 text-secondary dark:text-neutral-200 group-hover:text-primary transition-colors duration-200">
                                Título de la Tarjeta
                            </h3>
                            <p className="text-sm font-medium text-primary">
                                Un subtítulo o descripción corta.
                            </p>
                        </div>
                    </div>
                 </StyleGuideCard>
            </StyleGuideSection>

            {/* Icons */}
            <StyleGuideSection title="Iconos">
                <StyleGuideCard title="Iconos de Material Symbols">
                    <p className="text-muted-foreground mb-4">Usamos la librería de iconos de Google. Puedes encontrar miles de iconos <a href="https://fonts.google.com/icons" target="_blank" rel="noopener noreferrer" className="text-primary underline">aquí</a>.</p>
                    <div className="flex flex-wrap gap-8 items-center text-secondary-700 dark:text-neutral-300">
                        <div className="text-center"><span className="material-symbols-outlined text-4xl">home</span><p className="text-xs mt-1">home</p></div>
                        <div className="text-center"><span className="material-symbols-outlined text-4xl">settings</span><p className="text-xs mt-1">settings</p></div>
                        <div className="text-center"><span className="material-symbols-outlined text-4xl">search</span><p className="text-xs mt-1">search</p></div>
                        <div className="text-center"><span className="material-symbols-outlined text-4xl">favorite</span><p className="text-xs mt-1">favorite</p></div>
                        <div className="text-center"><span className="material-symbols-outlined text-4xl">delete</span><p className="text-xs mt-1">delete</p></div>
                        <div className="text-center"><span className="material-symbols-outlined text-4xl">verified</span><p className="text-xs mt-1">verified</p></div>
                    </div>
                </StyleGuideCard>
            </StyleGuideSection>

            {/* Prompting Guide */}
            <StyleGuideSection title="Cómo Pedir Cambios (Prompting)">
                <StyleGuideCard title="Guía para un Prompt Efectivo">
                    <div className="prose prose-neutral dark:prose-invert max-w-none">
                        <p>Para que pueda ayudarte de la mejor manera, es importante que tus peticiones sean claras, específicas y detalladas. Piensa en mí como un desarrollador que necesita una especificación clara.</p>
                        
                        <h4>Componentes Clave de un Buen Prompt:</h4>
                        <ul>
                            <li><strong>Qué:</strong> Describe el elemento a crear o modificar (un botón, una sección, una tarjeta, un formulario).</li>
                            <li><strong>Dónde:</strong> Indica su ubicación exacta (ej: "debajo del título principal", "en el footer a la derecha", "reemplaza la sección de Herramientas").</li>
                            <li><strong>Contenido:</strong> Proporciona el texto, los iconos o las imágenes que debe llevar. Si es dinámico, explica de dónde viene la información.</li>
                            <li><strong>Estilo y Apariencia:</strong> Usa las referencias de esta guía. (ej: "usa el color primario", "el botón debe ser de tamaño 'lg' y variante 'outline'", "la tarjeta debe tener sombra al pasar el ratón").</li>
                            <li><strong>Comportamiento:</strong> Explica qué debe hacer. (ej: "al hacer clic, debe mostrar una alerta", "los campos del formulario deben ser validados").</li>
                        </ul>

                        <hr className="my-6" />

                        <h4>Ejemplos:</h4>
                        
                        <h5><span className="text-destructive-500 font-bold">MAL PROMPT:</span></h5>
                        <blockquote className="border-l-4 border-destructive-500 pl-4">
                            <p className="italic text-muted-foreground">"Añade un botón de contacto."</p>
                        </blockquote>
                        <p className="text-sm">Esto es ambiguo. ¿Dónde va el botón? ¿Qué texto tiene? ¿De qué color es? ¿Qué hace al pulsarlo?</p>

                        <h5 className="mt-6"><span className="text-tertiary-600 font-bold">BUEN PROMPT:</span></h5>
                        <blockquote className="border-l-4 border-tertiary-500 pl-4">
                            <p className="italic text-muted-foreground">"En la sección de 'Tipografía', debajo de la tarjeta 'Estilos de Texto', agrega una nueva tarjeta titulada 'Ejemplo de Cita'. Dentro, coloca un elemento blockquote con el texto 'La simplicidad es la máxima sofisticación.' y atribúyelo a 'Leonardo da Vinci' en un párrafo pequeño y alineado a la derecha."</p>
                        </blockquote>
                        <p className="text-sm">Este prompt es perfecto. Es específico, describe el qué, dónde, el contenido y el estilo, usando los términos de esta guía.</p>

                        <h5 className="mt-6"><span className="text-tertiary-600 font-bold">OTRO BUEN PROMPT:</span></h5>
                        <blockquote className="border-l-4 border-tertiary-500 pl-4">
                            <p className="italic text-muted-foreground">"Crea una nueva sección llamada 'Nuestro Equipo' justo antes del footer. Debe tener un título y un subtítulo. Dentro, muestra una cuadrícula de 3 columnas con tarjetas de miembros del equipo. Cada tarjeta debe contener una imagen de avatar redonda, el nombre de la persona (H4), su cargo (párrafo pequeño y de color secundario) y tres botones pequeños de redes sociales (variante 'ghost' y tamaño 'icon') para Twitter, LinkedIn y GitHub."</p>
                        </blockquote>

                    </div>
                </StyleGuideCard>
            </StyleGuideSection>

        </div>
    );
};

export default StyleGuide;