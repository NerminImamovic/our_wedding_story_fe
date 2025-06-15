# React Hooks Overview

## React Hooks Used in Your Project

### 1. useState
**Purpose**: Manages state in functional components.

**Example from your code**:
```jsx
const [selectedFiles, setSelectedFiles] = useState<File[]>([])
const [previews, setPreviews] = useState<string[]>([])
```

**Usage**: Create a state variable and its updater function. Great for tracking values that change over time.

### 2. useEffect
**Purpose**: Handles side effects in components (data fetching, subscriptions, DOM manipulation).

**Example from your code**:
```jsx
useEffect(() => {
  setIsClient(true)
}, [])
```

**Usage**: Executes code after render and on dependency changes. The empty dependency array means it runs once after the initial render.

### 3. useCallback
**Purpose**: Memoizes functions to prevent unnecessary re-renders.

**Example from your code**:
```jsx
const handleDeleteImage = useCallback((image: ImageItem) => {
  if (confirm('Are you sure you want to delete this image?')) {
    deleteImageMutation.mutate(image.key)
  }
}, [deleteImageMutation])
```

**Usage**: Optimizes performance by preventing function recreation on every render.

### 4. useParams (Next.js)
**Purpose**: Accesses route parameters from Next.js.

**Example from your code**:
```jsx
const { slug } = useParams() as { slug: string }
```

**Usage**: Extracts route parameters from the URL.

### 5. useQuery (React Query)
**Purpose**: Manages asynchronous data fetching.

**Example from your code**:
```jsx
const { data, error, isLoading } = useQuery({
  queryKey: ['userImages', slug, userId],
  queryFn: () => getUserImages({ slug, userId }),
  enabled: !!userId,
})
```

**Usage**: Handles loading states, caching, refetching, and error states for API calls.

### 6. useMutation (React Query)
**Purpose**: Manages data mutations (create, update, delete).

**Example from your code**:
```jsx
const deleteImageMutation = useMutation({
  mutationFn: (imageKey: string) => deleteUserImage({ imageKey, bearerToken: '' }),
  onSuccess: () => {
    toast.success('Image deleted successfully')
    queryClient.invalidateQueries({ queryKey: ['userImages', slug, userId] })
  }
})
```

**Usage**: Handles mutations with success/error callbacks.

### 7. useQueryClient (React Query)
**Purpose**: Accesses the React Query client instance.

**Example from your code**:
```jsx
const queryClient = useQueryClient()
```

**Usage**: Enables interactions with the query cache, like invalidating queries.

## Additional React Hooks That Could Be Used

### 1. useReducer
**Purpose**: Manages complex state logic.

**Example for your project**:
```jsx
const initialState = { files: [], uploading: false, progress: [] };

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_FILES':
      return { ...state, files: [...state.files, ...action.files] };
    case 'SET_UPLOADING':
      return { ...state, uploading: action.uploading };
    case 'UPDATE_PROGRESS':
      const newProgress = [...state.progress];
      newProgress[action.index] = action.value;
      return { ...state, progress: newProgress };
    default:
      return state;
  }
}

function UploadComponent() {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  // Replace multiple useState calls
  // dispatch({ type: 'ADD_FILES', files: newFiles });
}
```

### 2. useRef
**Purpose**: Creates mutable references that persist across renders.

**Example for your project**:
```jsx
function UploadComponent() {
  const fileInputRef = useRef(null);
  
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };
  
  return (
    <>
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileUpload} 
      />
      <button onClick={triggerFileInput}>Select Files</button>
    </>
  );
}
```

### 3. useMemo
**Purpose**: Memoizes computed values to optimize performance.

**Example for your project**:
```jsx
function ImageGalleryComponent({ images }) {
  // Computed value that only changes when images change
  const sortedImages = useMemo(() => {
    return [...images].sort((a, b) => 
      new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime()
    );
  }, [images]);
  
  return (
    <div className="grid">
      {sortedImages.map(image => (
        <ImageItem key={image.key} image={image} />
      ))}
    </div>
  );
}
```

### 4. useContext
**Purpose**: Accesses React context without wrapper components.

**Example for your project**:
```jsx
// Create a context
const UploadContext = createContext();

// Provider component
function UploadProvider({ children }) {
  const [userId, setUserId] = useState('');
  
  return (
    <UploadContext.Provider value={{ userId, setUserId }}>
      {children}
    </UploadContext.Provider>
  );
}

// Consumer component
function UploadComponent() {
  const { userId } = useContext(UploadContext);
  
  // Now use userId without prop drilling
}
```

### 5. useLayoutEffect
**Purpose**: Similar to useEffect but fires synchronously after DOM mutations.

**Example for your project**:
```jsx
function ImagePreview({ src }) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const imgRef = useRef();
  
  useLayoutEffect(() => {
    if (imgRef.current) {
      const { width, height } = imgRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    }
  }, [src]);
  
  return <img ref={imgRef} src={src} alt="Preview" />;
}
```

### 6. useImperativeHandle
**Purpose**: Customizes the instance value exposed when using refs.

**Example for your project**:
```jsx
const FileUploader = forwardRef((props, ref) => {
  const inputRef = useRef();
  
  useImperativeHandle(ref, () => ({
    triggerUpload: () => inputRef.current.click(),
    clearFiles: () => inputRef.current.value = ''
  }));
  
  return <input type="file" ref={inputRef} />;
});

// Parent component
function UploadPage() {
  const uploaderRef = useRef();
  
  return (
    <>
      <FileUploader ref={uploaderRef} />
      <button onClick={() => uploaderRef.current.triggerUpload()}>
        Select Files
      </button>
    </>
  );
}
```

### 7. useDebugValue
**Purpose**: Displays a label for custom hooks in React DevTools.

**Example for your project**:
```jsx
function useUploadProgress(fileId) {
  const [progress, setProgress] = useState(0);
  
  // Custom hook logic...
  
  useDebugValue(`File #${fileId}: ${progress}%`);
  
  return progress;
}
```

### 8. Custom Hooks
**Purpose**: Extract and reuse stateful logic between components.

**Example for your project**:
```jsx
// Custom hook
function useFileUpload() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState([]);
  
  const addFiles = useCallback((newFiles) => {
    setFiles(prev => [...prev, ...newFiles]);
    setProgress(prev => [...prev, ...new Array(newFiles.length).fill(0)]);
  }, []);
  
  const uploadFiles = useCallback(async () => {
    setUploading(true);
    // Upload logic...
    setUploading(false);
  }, [files]);
  
  return { files, uploading, progress, addFiles, uploadFiles };
}

// Component using the hook
function UploadComponent() {
  const { files, uploading, progress, addFiles, uploadFiles } = useFileUpload();
  
  // Use the hook's returned values and functions
}
``` 
