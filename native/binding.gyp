
{
  "targets": [{
    "target_name": "Hashbounds",
    "include_dirs": [
                "<!(node -e \"require('nan')\")"
            ],
    "sources": [
      "hashbounds.cpp"
    ]
  }]
}