# MapLibre React App

A modern, high-performance React application using MapLibre GL JS as the map engine with Redux for state management. This application provides a comprehensive mapping solution with entity drawing, editing, and management capabilities.

## Features

### 🗺️ Map Features
- **Vector Tiles**: OpenStreetMap tiles for high-quality mapping
- **Full Map Rotation**: 0-360° rotation control via slider
- **Brightness Control**: Adjust map brightness (darken background only)
- **Responsive Design**: Works on desktop and mobile devices

### ✏️ Drawing Tools
- **Polygon**: Click to add points, double-click to finish
- **Line**: Click to add points, double-click to finish
- **Rectangle**: First click sets corner, second defines size, third sets rotation
- **Circle**: First click is center, second defines radius
- **Marker**: Single click to place

### 🏗️ Entity Management
- **Redux State Management**: Centralized state with byId, allIds, and groupedByType
- **Entity Tree**: Sidebar with all entities organized by type
- **Entity Editor**: Full editing capabilities with style controls
- **Persistent Storage**: Entities are serializable for save/load operations

### 🎨 UI/UX Features
- **Modern Interface**: Clean, professional design with Tailwind CSS
- **Interactive Controls**: Real-time visual feedback during editing
- **Entity Selection**: Click entities in sidebar to focus and edit
- **Style Customization**: Color, opacity, and stroke width controls

## Architecture

### Tech Stack
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Full type safety throughout the application
- **Redux Toolkit**: Modern Redux with RTK Query patterns
- **MapLibre GL JS**: Open-source mapping library
- **Mapbox GL Draw**: Drawing and editing tools
- **Tailwind CSS**: Utility-first CSS framework
- **Vite**: Fast build tool and development server

### Project Structure
```
src/
├── components/          # React components
│   ├── MapContainer.tsx
│   ├── Toolbar.tsx
│   ├── EntityTree.tsx
│   └── EntityEditor.tsx
├── hooks/              # Custom React hooks
│   ├── useAppDispatch.ts
│   └── useAppSelector.ts
├── services/           # Business logic and external services
│   └── mapService.ts
├── store/              # Redux store and slices
│   ├── store.ts
│   ├── entitySlice.ts
│   └── mapSlice.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── App.tsx             # Main application component
├── main.tsx           # Application entry point
└── index.css          # Global styles
```

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd maplibre-react-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## Usage

### Drawing Entities

1. **Select a drawing tool** from the toolbar
2. **Click on the map** to start drawing
3. **Follow the tool-specific instructions**:
   - **Polygon/Line**: Click to add points, double-click to finish
   - **Rectangle**: Click corner → click opposite corner → click for rotation
   - **Circle**: Click center → click to define radius
   - **Marker**: Single click to place

### Managing Entities

1. **View all entities** in the Entity Tree sidebar
2. **Click an entity** to select and focus on it
3. **Edit properties** in the Entity Editor panel
4. **Delete entities** using the trash icon in the tree

### Map Controls

- **Rotation Slider**: Adjust map rotation (0-360°)
- **Brightness Slider**: Control map brightness (0-2x)
- **Reset Map**: Return to default view
- **Clear All**: Remove all entities

## Development

### Key Features Implementation

#### Entity State Management
```typescript
// Redux slice with normalized state
const entitySlice = createSlice({
  name: 'entities',
  initialState: {
    byId: {},
    allIds: [],
    groupedByType: {
      polygon: [],
      line: [],
      rectangle: [],
      circle: [],
      marker: []
    }
  }
});
```

#### Map Service Integration
```typescript
// Isolated map logic
export class MapService {
  initialize(container, callbacks) {
    // MapLibre initialization
    // Event handling
    // Drawing tools setup
  }
}
```

#### Custom Hooks
```typescript
// Typed Redux hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### Extending the Application

#### Adding New Entity Types
1. Update `EntityType` in `types/index.ts`
2. Add drawing mode in `mapService.ts`
3. Update entity tree rendering
4. Add style controls to editor

#### Custom Map Styles
1. Modify the style object in `mapService.ts`
2. Add new tile sources
3. Configure layer properties

#### Additional Features
- **Save/Load**: Implement entity serialization
- **Export**: Add GeoJSON export functionality
- **Import**: Support for external data sources
- **Collaboration**: Real-time entity sharing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- [MapLibre GL JS](https://maplibre.org/) for the mapping engine
- [Mapbox GL Draw](https://github.com/mapbox/mapbox-gl-draw) for drawing tools
- [Redux Toolkit](https://redux-toolkit.js.org/) for state management
- [Tailwind CSS](https://tailwindcss.com/) for styling 