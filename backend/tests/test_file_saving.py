import sys
import os
import tempfile
sys.path.insert(0, 'backend')
from ai.planner.dispatcher import save_generated_files

def test_file_saving():
    with tempfile.TemporaryDirectory() as tmpdir:
        sample_output = """
Here is the implementation:

### File: src/components/Counter.tsx
```tsx
import React, { useState } from 'react';

export const Counter = () => {
    const [count, setCount] = useState(0);
    return <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>;
};
```

### File: src/styles/counter.css
```css
.counter {
    background: #c4f042;
}
```
"""
        saved = save_generated_files(sample_output, tmpdir)
        assert len(saved) == 2
        assert os.path.exists(os.path.join(tmpdir, "src", "components", "Counter.tsx"))
        assert os.path.exists(os.path.join(tmpdir, "src", "styles", "counter.css"))
        
        with open(os.path.join(tmpdir, "src", "components", "Counter.tsx"), "r", encoding="utf-8") as f:
            content = f.read()
            assert "export const Counter" in content

        print("File saving unit test passed successfully!")

if __name__ == "__main__":
    test_file_saving()
