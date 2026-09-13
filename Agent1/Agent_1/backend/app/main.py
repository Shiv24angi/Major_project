from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.responses import HTMLResponse
from app.api.routes import router


app = FastAPI(
    title="AI Startup Analyst - Agent 1",
    description="Document Analysis Agent",
    version="0.1.0",
    docs_url=None
)

# Compatibility workaround for Swagger UI / file uploads
app.openapi_version = "3.0.3"


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    # Ensure array file uploads have format: binary on items for Swagger UI compatibility
    schemas = openapi_schema.get("components", {}).get("schemas", {})
    for schema in schemas.values():
        properties = schema.get("properties", {})
        for prop in properties.values():
            if prop.get("type") == "array":
                items = prop.get("items", {})
                if (
                    items.get("contentMediaType") == "application/octet-stream"
                    or items.get("type") == "string"
                ):
                    items["format"] = "binary"

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    html_response = get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=app.title + " - Swagger UI",
    )

    custom_script = """
    <style>
    #operations-Documents-analyze_uploaded_documents_api_v1_analyze_documents_post tr[data-property-name="files"],
    #operations-Documents-analyze_uploaded_documents_api_v1_analyze_documents_post div[data-name="files"],
    #operations-Documents-analyze_uploaded_documents_api_v1_analyze_documents_post .parameters-table,
    #operations-Documents-analyze_uploaded_documents_api_v1_analyze_documents_post .opblock-section-request-body > div > table {
        display: none !important;
    }
    </style>
    <script>
    window.addEventListener('load', function() {
        // Intercept fetch calls to attach selected files into FormData
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            let [resource, config] = args;
            const url = typeof resource === 'string' ? resource : (resource && resource.url ? resource.url : '');
            if (config && url.includes('/api/v1/analyze-documents')) {
                const picker = document.getElementById('swagger-multi-file-picker');
                if (picker && picker.files && picker.files.length > 0) {
                    const formData = new FormData();
                    for (let i = 0; i < picker.files.length; i++) {
                        formData.append('files', picker.files[i], picker.files[i].name);
                    }
                    config.body = formData;
                    if (config.headers) {
                        if (config.headers instanceof Headers) {
                            config.headers.delete('Content-Type');
                            config.headers.delete('content-type');
                        } else if (typeof config.headers === 'object') {
                            delete config.headers['Content-Type'];
                            delete config.headers['content-type'];
                        }
                    }
                }
            }
            return originalFetch.apply(this, args);
        };

        // Inject UI widget and handle direct Analyze button
        setInterval(function() {
            const opBlock = document.querySelector('#operations-Documents-analyze_uploaded_documents_api_v1_analyze_documents_post');
            if (opBlock) {
                const bodySection = opBlock.querySelector('.opblock-section-request-body') || opBlock.querySelector('.parameters-container');
                if (bodySection && !opBlock.querySelector('#swagger-multi-file-container')) {
                    const container = document.createElement('div');
                    container.id = 'swagger-multi-file-container';
                    container.style.cssText = 'margin: 15px 20px; padding: 18px; background: #f0f7ff; border: 2px dashed #0066cc; border-radius: 8px; font-family: sans-serif;';
                    container.innerHTML = `
                        <label style="font-weight: bold; color: #004085; display: block; margin-bottom: 8px; font-size: 15px;">
                            📁 Choose Multiple Files for Analysis (.pdf, .docx, .pptx):
                        </label>
                        <input type="file" id="swagger-multi-file-picker" multiple accept=".pdf,.docx,.pptx" style="padding: 8px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; width: 80%;">
                        <div id="file-list-preview" style="font-size: 13px; margin-top: 10px; color: #155724; font-weight: 500;"></div>
                        <button id="swagger-analyze-btn" type="button" style="display: none; margin-top: 12px; background: #0066cc; color: white; border: none; padding: 12px 24px; font-size: 14px; font-weight: bold; border-radius: 6px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            🚀 Analyze Selected Documents Now
                        </button>
                        <div id="swagger-analysis-status" style="margin-top: 12px; font-weight: bold; font-size: 14px;"></div>
                        <pre id="swagger-analysis-output" style="display: none; margin-top: 12px; background: #1a202c; color: #63b3ed; padding: 14px; border-radius: 6px; max-height: 450px; overflow: auto; font-size: 12px;"></pre>
                    `;
                    bodySection.prepend(container);


                    const picker = container.querySelector('#swagger-multi-file-picker');
                    const analyzeBtn = container.querySelector('#swagger-analyze-btn');
                    const status = container.querySelector('#swagger-analysis-status');
                    const output = container.querySelector('#swagger-analysis-output');

                    picker.addEventListener('change', function() {
                        const preview = container.querySelector('#file-list-preview');
                        if (picker.files.length > 0) {
                            const names = Array.from(picker.files).map(f => f.name).join(', ');
                            preview.innerHTML = `✅ <b>Selected ${picker.files.length} file(s):</b> ${names}`;
                            analyzeBtn.style.display = 'inline-block';
                            
                            // Fill Swagger UI inputs
                            const inputs = opBlock.querySelectorAll('tr[data-property-name="files"] input, div[data-name="files"] input, input');
                            inputs.forEach(input => {
                                if (input.id !== 'swagger-multi-file-picker') {
                                    input.value = "file_selected";
                                    input.dispatchEvent(new Event('input', { bubbles: true }));
                                    input.dispatchEvent(new Event('change', { bubbles: true }));
                                }
                            });
                        } else {
                            preview.innerHTML = '';
                            analyzeBtn.style.display = 'none';
                        }
                    });

                    analyzeBtn.addEventListener('click', async function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        if (!picker.files || picker.files.length === 0) {
                            alert('Please choose at least one file first!');
                            return;
                        }

                        const formData = new FormData();
                        for (let i = 0; i < picker.files.length; i++) {
                            formData.append('files', picker.files[i], picker.files[i].name);
                        }

                        analyzeBtn.disabled = true;
                        analyzeBtn.style.background = '#6c757d';
                        status.style.color = '#004085';
                        status.innerHTML = '⏳ Uploading and running multi-document LangGraph analysis... Please wait...';
                        output.style.display = 'block';
                        output.innerText = '// Processing request...';

                        try {
                            const res = await fetch('/api/v1/analyze-documents', {
                                method: 'POST',
                                body: formData
                            });
                            const data = await res.json();
                            if (res.ok) {
                                status.style.color = '#155724';
                                status.innerHTML = '✅ Analysis Complete!';
                            } else {
                                status.style.color = '#721c24';
                                status.innerHTML = '❌ Error (' + res.status + '): ' + (data.detail || 'Failed');
                            }
                            output.innerText = JSON.stringify(data, null, 2);
                        } catch (err) {
                            status.style.color = '#721c24';
                            status.innerHTML = '❌ Request failed: ' + err.message;
                            output.innerText = err.stack || err;
                        } finally {
                            analyzeBtn.disabled = false;
                            analyzeBtn.style.background = '#0066cc';
                        }
                    });
                }
            }
        }, 800);
    });
    </script>
    """


    body_content = html_response.body.decode("utf-8")
    enhanced_content = body_content.replace("</body>", f"{custom_script}</body>")
    return HTMLResponse(content=enhanced_content)


app.include_router(
    router,
    prefix="/api/v1",
    tags=["Documents"]
)


@app.get("/test", response_class=HTMLResponse, include_in_schema=False)
async def test_ui():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Multi-File Upload Test</title>
        <style>
            body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; background: #f4f6f9; }
            .card { background: #ffffff; border: 1px solid #e1e4e8; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
            .dropzone { border: 2px dashed #0066cc; border-radius: 8px; padding: 40px; text-align: center; background: #f0f7ff; cursor: pointer; transition: all 0.2s; }
            .dropzone.dragover { background: #d0e4ff; border-color: #004085; }
            .dropzone:hover { background: #e2f0ff; }
            .btn { background: #0066cc; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 16px; font-size: 15px; }
            .btn:disabled { background: #a0aec0; cursor: not-allowed; }
            pre { background: #1a202c; color: #63b3ed; padding: 16px; border-radius: 8px; overflow-x: auto; max-height: 450px; font-size: 13px; }
        </style>
    </head>
    <body>
        <div class="card">
            <h2>🚀 AI Startup Analyst - Multi-Document Analyzer Test</h2>
            <p>Select or drag & drop multiple pitch decks, founder updates, or transcripts (<b>.pdf, .docx, .pptx</b>):</p>
            <div id="dropzone" class="dropzone" onclick="document.getElementById('file-input').click()">
                <div style="font-size: 32px; margin-bottom: 8px;">📁</div>
                <b>Click here or Drag & Drop multiple files</b>
                <div style="font-size: 13px; color: #718096; margin-top: 4px;">Supports PDF, DOCX, PPTX</div>
                <input type="file" id="file-input" multiple accept=".pdf,.docx,.pptx" style="display:none" onchange="updateList()">
            </div>
            <div id="file-list" style="margin-top: 12px; font-weight: bold; color: #2b6cb0;"></div>
            <button id="upload-btn" class="btn" onclick="uploadFiles()" disabled>Analyze Documents</button>
            <div id="status" style="margin-top: 16px; font-weight: bold;"></div>
            <h3 style="margin-top: 24px;">JSON Output:</h3>
            <pre id="output">// API response will appear here...</pre>
        </div>
        <script>
            const dropzone = document.getElementById('dropzone');
            const input = document.getElementById('file-input');

            ['dragenter', 'dragover'].forEach(eventName => {
                dropzone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropzone.classList.add('dragover');
                }, false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropzone.classList.remove('dragover');
                }, false);
            });

            dropzone.addEventListener('drop', (e) => {
                const dt = e.dataTransfer;
                if (dt && dt.files && dt.files.length > 0) {
                    input.files = dt.files;
                    updateList();
                }
            }, false);

            function updateList() {
                const btn = document.getElementById('upload-btn');
                const list = document.getElementById('file-list');
                if (input.files.length > 0) {
                    const names = Array.from(input.files).map(f => f.name).join(', ');
                    list.innerText = `Selected (${input.files.length}): ${names}`;
                    btn.disabled = false;
                } else {
                    list.innerText = '';
                    btn.disabled = true;
                }
            }

            async function uploadFiles() {
                const status = document.getElementById('status');
                const output = document.getElementById('output');
                const btn = document.getElementById('upload-btn');
                
                const formData = new FormData();
                for (const file of input.files) {
                    formData.append('files', file);
                }
                
                btn.disabled = true;
                status.innerText = '⏳ Uploading and running multi-document LangGraph analysis...';
                output.innerText = '// Processing request...';
                
                try {
                    const res = await fetch('/api/v1/analyze-documents', {
                        method: 'POST',
                        body: formData
                    });
                    const data = await res.json();
                    status.innerText = res.ok ? '✅ Analysis Complete!' : '❌ Error (' + res.status + '): ' + (data.detail || 'Failed');
                    output.innerText = JSON.stringify(data, null, 2);
                } catch (err) {
                    status.innerText = '❌ Request failed: ' + err.message;
                    output.innerText = err.stack || err;
                } finally {
                    btn.disabled = false;
                }
            }
        </script>
    </body>
    </html>
    """



@app.get("/")
def root():
    return {
        "message": "Agent 1 API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "agent": "document-analysis"
    }


