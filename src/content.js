// Todo el texto visible del micrositio vive aquí (luego se mapea a campos de módulos de HubSpot).
// Fuentes únicas: contexto/Wireframes_Quibdo_Editables.pptx (textos) y el audio del cliente (contenido del recorrido).
// Lo que va entre [corchetes] es contenido pendiente del cliente.

export const content = {
  campaignLink: 'Ver la campaña', // PPT slide 2
  campaignHref: '#', // [URL de la campaña]
  signText: 'CENTRO CÍRCULO',

  nav: [
    { id: 'inicio', label: 'Inicio', href: '#mapa' },
    { id: 'historias', label: 'Historias', href: '#historias' },
    { id: 'avance', label: 'Avance', href: '#avance' },
    { id: 'circulo', label: 'Círculo', href: '#circulo' },
    { id: 'tienda', label: 'Tienda', href: '#tienda' },
  ],
  ctaBrick: 'Deja tu ladrillo',
  menu: 'Menú',
  close: 'Cerrar',

  // PPT slide 1
  home: {
    kicker: 'Mujeres',
    title: ['Permanecer', 'ayuda a cerrar', 'el círculo'],
    lead: 'El círculo dorado de ayudas de Skandia busca levantar El Centro de Apoyo Círculo, para mujeres y jóvenes en Quibdó.',
    question: '¿Eres parte del círculo?',
    start: 'Empezar recorrido',
  },

  // PPT slide 2
  map: {
    sections: 'Ver secciones',
    backHome: 'Volver a la portada',
    destinationEmpty: 'Selecciona un punto para leer una descripción y abrir su sección.',
  },

  // Etiquetas: PPT slide 2. Descripciones: audio del cliente.
  hotspots: {
    plano: {
      label: 'Plano',
      section: 'Avance',
      desc: 'Todo el desarrollo del proyecto: cómo se va a comprar el terreno, la licitación de los planos y los servicios que va a prestar el centro comunitario.',
      action: 'Iniciar recorrido',
      href: '#avance',
    },
    ventana: {
      label: 'Ventana',
      section: 'Historias',
      desc: 'Cinco historias de mujeres de la Fundación: cómo llegan a la fundación, cuál es su trasfondo y qué esperan una vez el centro esté abierto.',
      action: 'Ver historias',
      href: '#historias',
    },
    puerta: {
      label: 'Puerta',
      section: 'Conoce El Círculo',
      desc: 'Conoce la Fundación Círculo.',
      action: 'Conoce El Círculo',
      href: '#circulo',
    },
    garaje: {
      label: 'Puesto',
      section: 'Tienda',
      desc: 'Los emprendimientos que estas mujeres trabajan desde la fundación. Lo que compras ayuda a financiar el proyecto.',
      action: 'Ir a la tienda',
      href: '#tienda',
    },
  },

  // Recorrido del plano: audio del cliente + PPT slide 5
  tour: {
    exit: 'Salir del recorrido',
    prev: 'Anterior',
    next: 'Siguiente',
    stepOf: (a, b) => `${a} / ${b}`,
    steps: [
      {
        id: 'terreno',
        kicker: 'Etapa 1',
        title: 'La compra del terreno',
        text: 'Cómo se va a comprar el terreno donde se levantará el centro comunitario.',
        data: [['Valor', '[$ —]'], ['Estado', '[Pendiente]']],
      },
      {
        id: 'planos',
        kicker: 'Etapa 2',
        title: 'La licitación de los planos',
        text: 'Cómo va a ser la licitación de los planos del centro.',
        data: [['Valor', '[$ —]'], ['Estado', '[Pendiente]']],
      },
      {
        id: 'obra',
        kicker: 'Etapa 3',
        title: 'Hitos de construcción con evidencia',
        text: '[Hitos de construcción con evidencia]',
        data: [['Valor', '[$ —]'], ['Estado', '[Pendiente]']],
      },
      {
        id: 'psicosocial',
        kicker: 'Sala',
        title: 'Sala de ayuda psicosocial',
        text: 'Para mujeres que lleguen a este espacio y puedan contar sus experiencias y tener un círculo, una red de apoyo.',
        data: [['Valor', '[$ —]']],
      },
      {
        id: 'legal',
        kicker: 'Sala',
        title: 'Asesorías legales',
        text: 'Para las personas que están enfrentando procesos de reparación, procesos de reivindicación o cualquier tipo de asunto legal, desde las ayudas de la Fundación Círculo.',
        data: [['Valor', '[$ —]']],
      },
      {
        id: 'taller',
        kicker: 'Taller',
        title: 'Taller de emprendimientos',
        text: 'Los emprendimientos que estas mujeres trabajan desde la fundación, con una plataforma para que ayuden a financiar el proyecto.',
        data: [['Valor', '[$ —]']],
        action: { label: 'Ir a la tienda', href: '#tienda' },
      },
      {
        id: 'avance',
        kicker: 'Avance',
        title: 'Así va el proyecto',
        text: 'A dónde se está yendo cada centavo que aportas.',
        data: [],
      },
    ],
  },

  // PPT slide 5
  avance: {
    goal: 1000,
    initialCount: 347, // valor de demo
    thermo: (n, goal) => `${n.toLocaleString('es-CO')} de ${goal.toLocaleString('es-CO')}`,
    cutoff: '[Fecha de corte]',
    budgetTitle: '¿En qué se gasta la plata?',
    budgetNote: '[Distribución pendiente de cifras reales]',
    budget: [
      { label: 'Terreno', pct: 25 },
      { label: 'Planos', pct: 15 },
      { label: 'Construcción', pct: 35 },
      { label: 'Salas', pct: 15 },
      { label: 'Taller', pct: 10 },
    ],
    milestonesTitle: 'Hitos de construcción con evidencia',
    milestones: [
      { title: 'Compra del terreno', status: '[Pendiente]' },
      { title: 'Licitación de los planos', status: '[Pendiente]' },
      { title: '[Hito de construcción]', status: '[Pendiente]' },
      { title: '[Hito de construcción]', status: '[Pendiente]' },
    ],
  },

  // PPT slides 3 y 4 + audio
  historias: {
    kicker: 'Ventana',
    title: 'Cinco historias de Quibdó',
    read: 'Leer historia',
    all: 'Todas las historias',
    next: 'Siguiente historia',
    media: '[Retrato o video con subtítulos]',
    portrait: '[Retrato autorizado]',
    items: [1, 2, 3, 4, 5].map((n) => ({
      title: `[Título del relato ${n}]`,
      name: '[Nombre autorizado]',
      lead: '[Entradilla]',
      sections: [
        { h: 'Cómo llegó a la fundación', p: '[Escena de apertura]' },
        { h: 'Su trasfondo en la fundación', p: '[Testimonio]' },
        { h: 'Qué espera una vez el centro esté abierto', p: '[Cierre]' },
      ],
    })),
  },

  // PPT slide 6 + audio
  circulo: {
    kicker: 'Puerta',
    title: 'Centro Comunitario Círculo',
    photo: '[Foto o render del centro]',
    blocks: [
      { h: 'Qué se busca construir en Quibdó', p: '[Qué se busca construir en Quibdó]' },
      { h: 'A quién acompaña', p: 'Mujeres y jóvenes en Quibdó. Servicios previstos: ayuda psicosocial, asesorías legales y taller de emprendimientos.' },
      { h: 'Fundación, aliados y contacto', p: '[Fundación, aliados y contacto oficial]' },
    ],
    action: 'Ver el avance del centro',
  },

  // PPT slide 7
  tienda: {
    kicker: 'Puesto',
    title: 'Productos de la comunidad',
    intro: '[Presentación de la comunidad]',
    buy: 'Comprar',
    products: [1, 2, 3, 4].map((n) => ({
      name: `[Producto ${n}]`,
      price: '[$ —]',
      stock: '[Disponibilidad]',
      origin: '[Ficha · origen y condiciones de entrega]',
    })),
  },

  // PPT slide 8
  nota: {
    kicker: 'Participación',
    title: 'Deja tu ladrillo',
    question: '¿Qué recuerdo de Navidad te hace sentir en casa?',
    placeholder: '[Campo de texto]',
    help: 'Nota anónima. Una nota equivale a un ladrillo simbólico.',
    submit: 'Enviar nota',
    doneTitle: 'Tu nota ya es parte de esta casa',
    doneText: (n) => `${n.toLocaleString('es-CO')} de 1.000`,
    doneAction: 'Ver el avance',
  },
};
