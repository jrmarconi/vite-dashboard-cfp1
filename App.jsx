import React, { useState, useEffect, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { 
  Upload, Users, Clock, CheckCircle, XCircle, AlertCircle, 
  Filter, Search, Calendar, Moon, Sun, Sunset, FileText, Info, BookOpen, UserCheck, FileSpreadsheet
} from 'lucide-react';

// --- Utilitarios para procesamiento de CSV ---

const parseCSV = (text) => {
  const rows = [];
  let currentRow = [];
  let currentString = '';
  let inQuotes = false;
  
  // Detectar separador (coma o punto y coma)
  const firstLine = text.split('\n')[0];
  const separator = firstLine.includes(';') ? ';' : ',';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentString += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      currentRow.push(currentString.trim());
      currentString = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (currentString || currentRow.length > 0) {
        currentRow.push(currentString.trim());
        rows.push(currentRow);
      }
      currentRow = [];
      currentString = '';
      if (char === '\r' && nextChar === '\n') i++;
    } else {
      currentString += char;
    }
  }
  if (currentString || currentRow.length > 0) {
    currentRow.push(currentString.trim());
    rows.push(currentRow);
  }
  return rows;
};

// --- Lógica de Inferencia de Género ---
const inferGender = (fullName) => {
  if (!fullName) return 'Desconocido';
  
  // Asume formato "Apellido, Nombre"
  const parts = fullName.split(',');
  if (parts.length < 2) return 'Desconocido';
  
  // Tomar el primer nombre, quitar espacios extra y convertir a mayúsculas
  const firstName = parts[1].trim().split(' ')[0].toUpperCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Quitar acentos

  // Excepciones comunes de nombres masculinos que terminan en A
  const maleExceptions = ['BAUTISTA', 'LUCA', 'NICOLA', 'SANTINO'];
  if (maleExceptions.includes(firstName)) return 'Masculino';

  // Excepciones comunes de nombres femeninos que NO terminan en A
  const femaleExceptions = [
    'SOL', 'BELEN', 'RAQUEL', 'RUTH', 'ESTHER', 'ABIGAIL', 'JAZMIN', 
    'LOURDES', 'CARMEN', 'DOLORES', 'MERCEDES', 'PILAR', 'MONSERRAT', 
    'MILAGROS', 'ANGELES', 'INES', 'LUZ', 'PAZ', 'ABRIL', 'NICOLE', 
    'ZOE', 'NOELIA', 'MAITE', 'ROCIO', 'GUADALUPE', 'SOLEDAD', 'BEATRIZ'
  ];
  if (femaleExceptions.includes(firstName)) return 'Femenino';

  // Regla general: Si termina en A es Femenino, si no es Masculino
  if (firstName.endsWith('A')) return 'Femenino';
  
  return 'Masculino';
};

// Datos de muestra
const SAMPLE_CSV = `Alumno,Identificación,Mail,Teléfono,Comisión,Estado Insc.,Actividad
"Aguirre Zanca, Karina Ana",DNI 24804039,karinaguirre75@gmail.com,11|26549320,CFP N° 1 - Río Cuarto - 1993 - 01-TT,Pendiente,(CL_1436) Operador de Herramientas de Marketing Digital
"ALARCON VILLAMAYOR, OLGA LILIOSA",DNI 95625371,lili90villamayor@gmail.com,11|28732605,CFP N° 1 - Río Cuarto - 1993 - 02-TN,Pendiente,(CL_1436) Operador de Herramientas de Marketing Digital
"ALVAREZ, MIRTA SUSANA",DNI 23454865,alvarezsusana549@gmail.com,011|60370455,CFP N° 1 - Río Cuarto - 1993 - 02-TN,Aceptada,(CL_1436) Operador de Herramientas de Marketing Digital
"Andriani, Camila AGUSTINA",DNI 47127952,camilalovers339@gmail.com,54|1159781620,CFP N° 1 - Río Cuarto - 1993 - 01-TT,Aceptada,(CL_1436) Operador de Herramientas de Marketing Digital
"PIREZ, PABLO NAHUEL",DNI 47435248,nahuelpirez12@gmail.com,,CFP N° 1 - Río Cuarto - 1993 - 05-TN,Pendiente,(TR_MYA_ME_1) Sistema motor de combustión interna
"RAMOS, AGOSTINA CELESTE",DNI 47738200,agostinacr28@gmail.com,,CFP N° 1 - Río Cuarto - 1993 - 04-TM,Pendiente,(TR_MYA_ME_1) Sistema motor de combustión interna
"RANONE GIGENA, NAHUEL EZEQUIEL",DNI 47126080,cfp6ezequielranone@gmail.com,,CFP N° 1 - Río Cuarto - 1993 - 04-TM,Pendiente,(TR_MYA_ME_1) Sistema motor de combustión interna
"REYNAGA VALE, FRANCISCO",DNI 94056832,juanrenvion@gmail.com,,CFP N° 1 - Río Cuarto - 1993 - 04-TM,Rechazada,(TR_MYA_ME_1) Sistema motor de combustión interna
"REYNAGA VALE, FRANCISCO",DNI 94056832,juanrenvion@gmail.com,,CFP N° 1 - Río Cuarto - 1993 - 04-TM,Aceptada,(TR_MYA_ME_1) Sistema motor de combustión interna`;

const COLORS = {
  TM: '#F59E0B', 
  TT: '#F97316', 
  TN: '#3B82F6', 
  Unknown: '#9CA3AF',
  Aceptada: '#10B981',
  Pendiente: '#F59E0B',
  Rechazada: '#EF4444',
  Femenino: '#EC4899', // Rosa
  Masculino: '#3B82F6' // Azul
};

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, type }) => {
  let classes = "px-2 py-1 rounded-full text-xs font-semibold ";
  switch (type) {
    case 'Aceptada': classes += "bg-green-100 text-green-800"; break;
    case 'Rechazada': classes += "bg-red-100 text-red-800"; break;
    case 'Pendiente': classes += "bg-yellow-100 text-yellow-800"; break;
    case 'TM': classes += "bg-amber-100 text-amber-800 border border-amber-200"; break;
    case 'TT': classes += "bg-orange-100 text-orange-800 border border-orange-200"; break;
    case 'TN': classes += "bg-blue-100 text-blue-800 border border-blue-200"; break;
    case 'Femenino': classes += "bg-pink-100 text-pink-800 border border-pink-200"; break;
    case 'Masculino': classes += "bg-blue-100 text-blue-800 border border-blue-200"; break;
    default: classes += "bg-gray-100 text-gray-800";
  }
  return <span className={classes}>{children}</span>;
};

const OfferBadge = ({ type }) => {
  let classes = "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ";
  switch (type) {
    case 'Capacitación Laboral': classes += "bg-purple-100 text-purple-700 border border-purple-200"; break;
    case 'Curso': classes += "bg-teal-100 text-teal-700 border border-teal-200"; break;
    case 'Trayecto': classes += "bg-rose-100 text-rose-700 border border-rose-200"; break;
    default: classes += "bg-slate-100 text-slate-500 border border-slate-200";
  }
  return <span className={classes}>{type === 'Capacitación Laboral' ? 'Cap. Laboral' : type}</span>;
};

export default function DashboardInscripciones() {
  const [rawData, setRawData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filterTurno, setFilterTurno] = useState('Todos');
  const [filterActividad, setFilterActividad] = useState('Todas');
  const [filterEstado, setFilterEstado] = useState('Todos');
  const [filterTipoOferta, setFilterTipoOferta] = useState('Todos');
  const [filterGenero, setFilterGenero] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSampleData, setIsSampleData] = useState(true);
  const [fileName, setFileName] = useState('');

  // Carga inicial de datos de muestra
  useEffect(() => {
    processCSV(SAMPLE_CSV, true);
  }, []);

  const processCSV = (csvText, isSample = false) => {
    try {
      const parsed = parseCSV(csvText);
      const headers = parsed[0];
      const dataRows = parsed.slice(1);

      const processed = dataRows.map(row => {
        const item = {};
        headers.forEach((header, index) => {
          let key = header.trim();
          if (key.includes('Alumno')) key = 'alumno';
          else if (key.includes('Identificación')) key = 'dni';
          else if (key.includes('Mail')) key = 'email';
          else if (key.includes('Comisión')) key = 'comision';
          else if (key.includes('Estado')) key = 'estado';
          else if (key.includes('Actividad')) key = 'actividad';
          
          item[key] = row[index];
        });

        // Lógica de detección de Turno
        let turno = 'Desconocido';
        const comision = item.comision || '';
        if (comision.includes('- TM') || comision.includes('-TM') || comision.endsWith('TM')) turno = 'TM';
        else if (comision.includes('- TT') || comision.includes('-TT') || comision.endsWith('TT')) turno = 'TT';
        else if (comision.includes('- TN') || comision.includes('-TN') || comision.endsWith('TN')) turno = 'TN';
        
        // Lógica de detección de Tipo de Oferta
        let tipoOferta = 'Otro';
        const rawActividad = item.actividad || '';
        if (rawActividad.includes('(CL_')) tipoOferta = 'Capacitación Laboral';
        else if (rawActividad.includes('(CT_')) tipoOferta = 'Curso';
        else if (rawActividad.includes('(TR_')) tipoOferta = 'Trayecto';

        // Lógica de detección de Género
        item.genero = inferGender(item.alumno);

        item.tipoOferta = tipoOferta;
        item.turno = turno;
        item.actividadSimple = item.actividad ? item.actividad.replace(/^\([A-Z0-9_]+\)\s*/, '') : 'Sin Actividad';

        return item;
      }).filter(item => item.alumno);

      setRawData(processed);
      setIsSampleData(isSample);
      if (isSample) setFileName('Datos de Ejemplo');
    } catch (e) {
      console.error("Error procesando CSV", e);
      alert("Error al procesar el archivo. Asegúrate de que sea un CSV válido.");
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => processCSV(e.target.result, false);
      reader.readAsText(file);
    }
  };

  // Filtrado de datos
  useEffect(() => {
    let result = rawData;

    if (filterTurno !== 'Todos') {
      result = result.filter(item => item.turno === filterTurno);
    }

    if (filterEstado !== 'Todos') {
      result = result.filter(item => item.estado && item.estado.trim() === filterEstado);
    }
    
    if (filterTipoOferta !== 'Todos') {
      result = result.filter(item => item.tipoOferta === filterTipoOferta);
    }
    
    if (filterGenero !== 'Todos') {
      result = result.filter(item => item.genero === filterGenero);
    }

    if (filterActividad !== 'Todas') {
      result = result.filter(item => item.actividadSimple === filterActividad);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => 
        (item.alumno && item.alumno.toLowerCase().includes(term)) ||
        (item.dni && item.dni.toLowerCase().includes(term))
      );
    }

    setFilteredData(result);
  }, [rawData, filterTurno, filterEstado, filterActividad, filterTipoOferta, filterGenero, searchTerm]);

  // Cálculos para KPIs y Gráficos
  const stats = useMemo(() => {
    const total = filteredData.length;
    const porTurno = { TM: 0, TT: 0, TN: 0, Desconocido: 0 };
    const porEstado = { Aceptada: 0, Pendiente: 0, Rechazada: 0 };
    const porGenero = { Femenino: 0, Masculino: 0, Desconocido: 0 };
    const porActividad = {};

    filteredData.forEach(item => {
      // Turno
      if (porTurno[item.turno] !== undefined) porTurno[item.turno]++;
      else porTurno.Desconocido++;

      // Estado
      const estado = item.estado ? item.estado.trim() : 'Desconocido';
      if (porEstado[estado] !== undefined) porEstado[estado]++;
      
      // Genero
      if (porGenero[item.genero] !== undefined) porGenero[item.genero]++;
      else porGenero.Desconocido++;

      // Actividad
      const act = item.actividadSimple;
      porActividad[act] = (porActividad[act] || 0) + 1;
    });

    const chartDataTurno = [
      { name: 'Mañana (TM)', value: porTurno.TM, key: 'TM' },
      { name: 'Tarde (TT)', value: porTurno.TT, key: 'TT' },
      { name: 'Noche (TN)', value: porTurno.TN, key: 'TN' },
    ].filter(d => d.value > 0);

    const chartDataEstado = [
      { name: 'Aceptada', value: porEstado.Aceptada, color: COLORS.Aceptada },
      { name: 'Pendiente', value: porEstado.Pendiente, color: COLORS.Pendiente },
      { name: 'Rechazada', value: porEstado.Rechazada, color: COLORS.Rechazada },
    ].filter(d => d.value > 0);
    
    const chartDataGenero = [
      { name: 'Femenino', value: porGenero.Femenino, key: 'Femenino' },
      { name: 'Masculino', value: porGenero.Masculino, key: 'Masculino' },
    ].filter(d => d.value > 0);

    const chartDataActividad = Object.keys(porActividad).map(key => ({
      name: key.length > 20 ? key.substring(0, 20) + '...' : key,
      fullName: key,
      value: porActividad[key]
    })).sort((a, b) => b.value - a.value);

    return { total, porTurno, porEstado, porGenero, chartDataTurno, chartDataEstado, chartDataActividad, chartDataGenero };
  }, [filteredData]);

  const uniqueActivities = useMemo(() => {
    return [...new Set(rawData.map(item => item.actividadSimple))].sort();
  }, [rawData]);

  const uniqueEstados = useMemo(() => {
    return [...new Set(rawData.map(item => item.estado ? item.estado.trim() : null).filter(Boolean))].sort();
  }, [rawData]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 p-4 md:p-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-8 h-8 text-blue-600" />
            Tablero de Inscripciones (2026)
          </h1>
          <p className="text-slate-500 mt-1">Análisis Demográfico y de Ofertas</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
           <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition shadow-md">
            <Upload className="w-4 h-4" />
            <span>Subir CSV Completo</span>
            <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {isSampleData ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-800">Modo de Demostración</h4>
            <p className="text-sm text-amber-700">
              Actualmente estás viendo <strong>datos de ejemplo</strong>. Para ver los datos de hoy, sube el archivo actualizado.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <FileSpreadsheet className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-800">Archivo Cargado: {fileName}</h4>
            <p className="text-sm text-blue-700">
              Estás visualizando el análisis del archivo que acabas de subir.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards Row 1: Demographics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card className="p-4 border-l-4 border-slate-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-100 rounded-full text-slate-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Inscriptos</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-pink-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-pink-50 rounded-full text-pink-600">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Mujeres (Est.)</p>
              <p className="text-2xl font-bold">{stats.porGenero.Femenino}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 border-l-4 border-blue-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-full text-blue-600">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Hombres (Est.)</p>
              <p className="text-2xl font-bold">{stats.porGenero.Masculino}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Stats Cards Row 2: Turnos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4 border-l-4 border-amber-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-full text-amber-600">
              <Sun className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Turno Mañana (TM)</p>
              <p className="text-2xl font-bold">{stats.porTurno.TM}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-orange-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 rounded-full text-orange-600">
              <Sunset className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Turno Tarde (TT)</p>
              <p className="text-2xl font-bold">{stats.porTurno.TT}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-indigo-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
              <Moon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Turno Noche (TN)</p>
              <p className="text-2xl font-bold">{stats.porTurno.TN}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-8 sticky top-0 z-20 shadow-md">
        <div className="flex flex-col md:flex-row gap-4 items-center flex-wrap">
          <div className="flex items-center gap-2 text-slate-600">
            <Filter className="w-4 h-4" />
            <span className="font-semibold text-sm">Filtros:</span>
          </div>
          
          <select 
            value={filterGenero}
            onChange={(e) => setFilterGenero(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="Todos">Todos los Géneros</option>
            <option value="Femenino">Femenino</option>
            <option value="Masculino">Masculino</option>
          </select>

          <select 
            value={filterTipoOferta}
            onChange={(e) => setFilterTipoOferta(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="Todos">Todas las Ofertas</option>
            <option value="Capacitación Laboral">Capacitación Laboral (CL)</option>
            <option value="Curso">Curso (CT)</option>
            <option value="Trayecto">Trayecto (TR)</option>
          </select>

          <select 
            value={filterTurno}
            onChange={(e) => setFilterTurno(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="Todos">Todos los Turnos</option>
            <option value="TM">Mañana (TM)</option>
            <option value="TT">Tarde (TT)</option>
            <option value="TN">Noche (TN)</option>
          </select>

          <select 
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="Todos">Todos los Estados</option>
            {uniqueEstados.map(est => (
              <option key={est} value={est}>{est}</option>
            ))}
          </select>

          <select 
            value={filterActividad}
            onChange={(e) => setFilterActividad(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white max-w-xs truncate"
          >
            <option value="Todas">Todas las Actividades</option>
            {uniqueActivities.map(act => (
              <option key={act} value={act}>{act}</option>
            ))}
          </select>

          <div className="relative flex-1 w-full min-w-[200px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por alumno o DNI..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Distribución por Género */}
        <Card className="p-6 col-span-1">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Género (Estimado)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.chartDataGenero}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.chartDataGenero.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.key]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Distribución por Turno */}
        <Card className="p-6 col-span-1">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Turnos</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.chartDataTurno}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.chartDataTurno.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.key]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

         {/* Estado de Inscripciones */}
        <Card className="p-6 col-span-1">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Estados</h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartDataEstado} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {stats.chartDataEstado.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Actividades Top */}
        <Card className="p-6 col-span-1">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Top Actividades</h3>
          <div className="h-64 overflow-y-auto">
             <ul className="space-y-3">
               {stats.chartDataActividad.slice(0, 5).map((act, idx) => (
                 <li key={idx} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                   <div className="flex items-center gap-2 overflow-hidden">
                      <span className="w-5 h-5 flex items-center justify-center bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-medium truncate" title={act.fullName}>{act.fullName}</span>
                   </div>
                   <span className="font-bold text-slate-700 text-sm">{act.value}</span>
                 </li>
               ))}
             </ul>
          </div>
        </Card>
      </div>

      {/* Actividad Chart Full Width */}
      <Card className="p-6 mb-8">
        <h3 className="text-lg font-semibold mb-6 text-slate-800">Distribución de Alumnos por Actividad</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.chartDataActividad} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                interval={0} 
                angle={-45} 
                textAnchor="end" 
                height={70} 
                tick={{fontSize: 10}}
              />
              <YAxis />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 border shadow-lg rounded text-sm">
                        <p className="font-bold">{payload[0].payload.fullName}</p>
                        <p className="text-blue-600">Alumnos: {payload[0].value}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Data Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-700">Detalle de Inscriptos ({filteredData.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold">
              <tr>
                <th className="p-4">Alumno</th>
                <th className="p-4">Género (Est.)</th>
                <th className="p-4">Identificación</th>
                <th className="p-4">Turno</th>
                <th className="p-4">Tipo Oferta</th>
                <th className="p-4">Actividad</th>
                <th className="p-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredData.length > 0 ? (
                filteredData.map((row, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-medium text-slate-800">{row.alumno}</td>
                    <td className="p-4">
                       <Badge type={row.genero}>{row.genero}</Badge>
                    </td>
                    <td className="p-4 text-slate-500">{row.dni}</td>
                    <td className="p-4">
                      <Badge type={row.turno}>{row.turno}</Badge>
                    </td>
                    <td className="p-4">
                       <OfferBadge type={row.tipoOferta} />
                    </td>
                    <td className="p-4 text-slate-600 truncate max-w-[200px]" title={row.actividadSimple}>
                      {row.actividadSimple}
                    </td>
                    <td className="p-4">
                      <Badge type={row.estado}>{row.estado}</Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">
                    No se encontraron resultados con los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      <div className="mt-4 text-center text-xs text-slate-400">
        Sistema de Visualización de Inscripciones v1.0
      </div>
    </div>
  );
}


