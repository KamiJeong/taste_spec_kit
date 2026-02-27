param(
  [string]$Repo = ""
)

$labels = @(
  @{ Name = "kind:feature"; Color = "0E8A16"; Description = "Feature work" },
  @{ Name = "kind:bug"; Color = "D73A4A"; Description = "Bug fix work" },
  @{ Name = "kind:chore"; Color = "FBCA04"; Description = "Maintenance or chore" },
  @{ Name = "kind:docs"; Color = "1D76DB"; Description = "Documentation work" },

  @{ Name = "prio:p0"; Color = "B60205"; Description = "Critical priority" },
  @{ Name = "prio:p1"; Color = "D93F0B"; Description = "High priority" },
  @{ Name = "prio:p2"; Color = "FBCA04"; Description = "Normal priority" },

  @{ Name = "area:web"; Color = "5319E7"; Description = "Web app area" },
  @{ Name = "area:api"; Color = "0052CC"; Description = "API area" },
  @{ Name = "area:infra"; Color = "006B75"; Description = "Infrastructure area" },
  @{ Name = "area:spec"; Color = "0366D6"; Description = "Spec/process area" },
  @{ Name = "area:ci"; Color = "C2E0C6"; Description = "CI/CD area" },

  @{ Name = "codex:triage"; Color = "C5DEF5"; Description = "Awaiting Codex triage" },
  @{ Name = "codex:ready"; Color = "BFDADC"; Description = "Ready for Codex run" },
  @{ Name = "codex:running"; Color = "0E8A16"; Description = "Codex is executing" },
  @{ Name = "codex:blocked"; Color = "D93F0B"; Description = "Blocked and needs human action" },
  @{ Name = "codex:done"; Color = "5319E7"; Description = "Codex work completed" },

  @{ Name = "needs:maintainer"; Color = "F9D0C4"; Description = "Needs maintainer action" },
  @{ Name = "needs:product"; Color = "F9D0C4"; Description = "Needs product decision" },
  @{ Name = "needs:access"; Color = "F9D0C4"; Description = "Needs access/credential setup" },
  @{ Name = "needs:decision"; Color = "F9D0C4"; Description = "Needs explicit decision before coding" }
)

foreach ($label in $labels) {
  $args = @("label", "create", $label.Name, "--color", $label.Color, "--description", $label.Description, "--force")
  if ($Repo) {
    $args += @("--repo", $Repo)
  }
  gh @args
}

Write-Output "Label sync complete."
